package com.bookstore.controller;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.bson.Document;

import com.bookstore.repository.UserRepository;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

public class OrderHandler implements HttpHandler {
    private final UserRepository userRepository = new UserRepository();
    private final Gson gson = new Gson();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod();

        // CORS Setup
        Headers headers = exchange.getResponseHeaders();
        headers.add("Access-Control-Allow-Origin", "*");
        headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization");
        headers.add("Content-Type", "application/json");

        if ("OPTIONS".equalsIgnoreCase(method)) {
            exchange.sendResponseHeaders(200, -1);
            return;
        }

        try {
            if ("/orders/complete".equals(path) && "POST".equalsIgnoreCase(method)) {
                handleCompleteOrder(exchange);
            } else if ("/orders/history".equals(path) && "GET".equalsIgnoreCase(method)) {
                handleOrderHistory(exchange);
            } else {
                sendResponse(exchange, 404, new Document("error", "Not Found"));
            }
        } catch (Exception e) {
            e.printStackTrace();
            sendResponse(exchange, 500, new Document("error", "Internal Server Error: " + e.getMessage()));
        }
    }

    private void handleCompleteOrder(HttpExchange exchange) throws IOException {
        String authHeader = exchange.getRequestHeaders().getFirst("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            sendResponse(exchange, 401, new Document("error", "Missing or invalid token"));
            return;
        }

        String userId = authHeader.substring(7);
        String requestBody = readRequestBody(exchange);
        
        JsonObject jsonRequest = gson.fromJson(requestBody, JsonObject.class);
        JsonArray items = jsonRequest.getAsJsonArray("items");
        
        if (items == null || items.size() == 0) {
            sendResponse(exchange, 400, new Document("error", "No items in order"));
            return;
        }

        List<Document> purchases = new ArrayList<>();
        List<Document> rentals = new ArrayList<>();
        
        for (JsonElement itemElement : items) {
            JsonObject item = itemElement.getAsJsonObject();
            String bookId = item.get("bookId").getAsString();
            String bookTitle = item.get("bookTitle").getAsString();
            String bookAuthor = item.get("bookAuthor").getAsString();
            String bookThumbnail = item.has("bookThumbnail") ? item.get("bookThumbnail").getAsString() : "";
            double price = item.get("price").getAsDouble();
            int quantity = item.has("quantity") ? item.get("quantity").getAsInt() : 1;
            String option = item.get("option").getAsString();

            if ("buy".equals(option)) {
                Document purchase = new Document()
                    .append("bookId", bookId)
                    .append("bookTitle", bookTitle)
                    .append("bookAuthor", bookAuthor)
                    .append("bookThumbnail", bookThumbnail)
                    .append("price", price)
                    .append("quantity", quantity)
                    .append("purchaseDate", new Date());
                purchases.add(purchase);
            } else if ("rent".equals(option)) {
                int durationDays = item.get("durationDays").getAsInt();
                Date rentalDate = new Date();
                Date expiryDate = new Date(rentalDate.getTime() + (durationDays * 24L * 60L * 60L * 1000L));
                
                Document rental = new Document()
                    .append("bookId", bookId)
                    .append("bookTitle", bookTitle)
                    .append("bookAuthor", bookAuthor)
                    .append("bookThumbnail", bookThumbnail)
                    .append("price", price)
                    .append("quantity", quantity)
                    .append("durationDays", durationDays)
                    .append("rentalDate", rentalDate)
                    .append("expiryDate", expiryDate);
                rentals.add(rental);
            }
        }
        
        boolean success = userRepository.addOrdersToUser(userId, purchases, rentals);
        
        if (success) {
            Document response = new Document()
                .append("success", true)
                .append("message", "Order completed successfully")
                .append("purchasesCount", purchases.size())
                .append("rentalsCount", rentals.size());
            sendResponse(exchange, 200, response);
        } else {
            sendResponse(exchange, 500, new Document("error", "Failed to save order"));
        }
    }

    private void handleOrderHistory(HttpExchange exchange) throws IOException {
        String authHeader = exchange.getRequestHeaders().getFirst("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            sendResponse(exchange, 401, new Document("error", "Missing or invalid token"));
            return;
        }

        String userId = authHeader.substring(7);
        Document userDoc = userRepository.findById(userId);
        
        if (userDoc != null) {
            Document history = new Document();
            history.append("purchases", userDoc.get("purchases", new ArrayList<>()));
            history.append("rentals", userDoc.get("rentals", new ArrayList<>()));
            sendResponse(exchange, 200, history);
        } else {
            sendResponse(exchange, 404, new Document("error", "User not found"));
        }
    }

    private String readRequestBody(HttpExchange exchange) throws IOException {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(exchange.getRequestBody()))) {
            return br.lines().collect(Collectors.joining(System.lineSeparator()));
        }
    }

    private void sendResponse(HttpExchange exchange, int statusCode, Object data) throws IOException {
        String jsonResponse = gson.toJson(data);
        byte[] bytes = jsonResponse.getBytes();
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }
}   