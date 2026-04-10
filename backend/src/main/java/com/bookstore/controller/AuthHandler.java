package com.bookstore.controller;

import com.bookstore.model.User;
import com.bookstore.service.UserService;
import com.bookstore.repository.UserRepository;
import com.google.gson.Gson;
import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.bson.Document;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.util.stream.Collectors;

public class AuthHandler implements HttpHandler {
    private final UserService userService = new UserService();
    private final UserRepository userRepository = new UserRepository();
    private final Gson gson = new Gson();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod();

        // CORS Setup
        Headers headers = exchange.getResponseHeaders();
        headers.add("Access-Control-Allow-Origin", "*");
        headers.add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization");
        headers.add("Content-Type", "application/json");

        if ("OPTIONS".equalsIgnoreCase(method)) {
            exchange.sendResponseHeaders(200, -1);
            return;
        }

        try {
            String requestBody = readRequestBody(exchange);
            Document reqData = requestBody.isEmpty() ? null : Document.parse(requestBody);

            if ("/users/register".equals(path) && "POST".equalsIgnoreCase(method)) {
                handleRegister(reqData, exchange);
            } else if ("/users/login".equals(path) && "POST".equalsIgnoreCase(method)) {
                handleLogin(reqData, exchange);
            } else if ("/users/profile".equals(path) && "GET".equalsIgnoreCase(method)) {
                handleProfile(exchange);
            } else if ("/users/profile".equals(path) && "PUT".equalsIgnoreCase(method)) {
                handleUpdateProfile(reqData, exchange);
            } else if ("/users/password".equals(path) && "PUT".equalsIgnoreCase(method)) {
                handleUpdatePassword(reqData, exchange);
            } else if ("/users/delete".equals(path) && "DELETE".equalsIgnoreCase(method)) {
                handleDelete(exchange);
            } else {
                sendResponse(exchange, 404, new Document("error", "Not Found"));
            }
        } catch (Exception e) {
            e.printStackTrace();
            sendResponse(exchange, 500, new Document("error", "Internal Server Error"));
        }
    }

    private String readRequestBody(HttpExchange exchange) throws IOException {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(exchange.getRequestBody()))) {
            return br.lines().collect(Collectors.joining(System.lineSeparator()));
        }
    }

    private void sendResponse(HttpExchange exchange, int statusCode, Document data) throws IOException {
        String jsonResponse = gson.toJson(data);
        byte[] bytes = jsonResponse.getBytes();
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private void handleRegister(Document reqData, HttpExchange exchange) throws IOException {
        String name = reqData != null ? reqData.getString("name") : null;
        String email = reqData != null ? reqData.getString("email") : null;
        String password = reqData != null ? reqData.getString("password") : null;

        if (name == null || email == null || password == null) {
            sendResponse(exchange, 400, new Document("error", "Missing required fields"));
            return;
        }

        User newUser = userService.register(name, email, password);

        if (newUser != null) {
            Document resDoc = new Document("id", newUser.getId().toHexString())
                                    .append("name", newUser.getName())
                                    .append("email", newUser.getEmail());
            sendResponse(exchange, 201, resDoc);
        } else {
            sendResponse(exchange, 409, new Document("error", "User with this email already exists"));
        }
    }
    
    private void handleLogin(Document reqData, HttpExchange exchange) throws IOException {
        String email = reqData != null ? reqData.getString("email") : null;
        String password = reqData != null ? reqData.getString("password") : null;

        if (email == null || password == null) {
            sendResponse(exchange, 400, new Document("error", "Missing required fields"));
            return;
        }

        Document userDoc = userService.login(email, password);

        if (userDoc != null) {
            String token = userDoc.getObjectId("_id").toHexString(); 
            userDoc.append("token", token);
            userDoc.remove("_id");
            
            sendResponse(exchange, 200, userDoc);
        } else {
            sendResponse(exchange, 401, new Document("error", "Invalid email or password"));
        }
    }
    
    private void handleProfile(HttpExchange exchange) throws IOException {
        String authHeader = exchange.getRequestHeaders().getFirst("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            sendResponse(exchange, 401, new Document("error", "Missing or invalid token"));
            return;
        }

        String userId = authHeader.substring(7);

        Document userDoc = userService.getProfile(userId);

        if (userDoc != null) {
            userDoc.remove("_id"); 
            sendResponse(exchange, 200, userDoc);
        } else {
            sendResponse(exchange, 404, new Document("error", "User not found or invalid token"));
        }
    }

    private void handleUpdateProfile(Document reqData, HttpExchange exchange) throws IOException {
        String authHeader = exchange.getRequestHeaders().getFirst("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            sendResponse(exchange, 401, new Document("error", "Missing or invalid token"));
            return;
        }

        String userId = authHeader.substring(7);
        String name = reqData != null ? reqData.getString("name") : null;
        String bio = reqData != null ? reqData.getString("bio") : "";

        if (name == null || name.trim().isEmpty()) {
            sendResponse(exchange, 400, new Document("error", "Name is required"));
            return;
        }

        boolean updated = userRepository.updateProfile(userId, name, bio);

        if (updated) {
            sendResponse(exchange, 200, new Document("success", true).append("message", "Profile updated successfully"));
        } else {
            sendResponse(exchange, 500, new Document("error", "Failed to update profile"));
        }
    }

    private void handleUpdatePassword(Document reqData, HttpExchange exchange) throws IOException {
        String authHeader = exchange.getRequestHeaders().getFirst("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            sendResponse(exchange, 401, new Document("error", "Missing or invalid token"));
            return;
        }

        String userId = authHeader.substring(7);
        String currentPassword = reqData != null ? reqData.getString("currentPassword") : null;
        String newPassword = reqData != null ? reqData.getString("newPassword") : null;

        if (currentPassword == null || newPassword == null) {
            sendResponse(exchange, 400, new Document("error", "Missing required fields"));
            return;
        }

        boolean updated = userService.updatePassword(userId, currentPassword, newPassword);

        if (updated) {
            sendResponse(exchange, 200, new Document("success", true).append("message", "Password updated successfully"));
        } else {
            sendResponse(exchange, 400, new Document("error", "Current password is incorrect"));
        }
    }

    private void handleDelete(HttpExchange exchange) throws IOException {
        String authHeader = exchange.getRequestHeaders().getFirst("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            sendResponse(exchange, 401, new Document("error", "Missing or invalid token"));
            return;
        }

        String userId = authHeader.substring(7);

        boolean deleted = userRepository.deleteUser(userId);

        if (deleted) {
            sendResponse(exchange, 200, new Document("success", true).append("message", "Account deleted"));
        } else {
            sendResponse(exchange, 404, new Document("error", "User not found or invalid token"));
        }
    }
}