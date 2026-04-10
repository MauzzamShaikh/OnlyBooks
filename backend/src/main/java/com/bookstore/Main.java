package com.bookstore;

import com.bookstore.controller.AuthHandler;
import com.bookstore.controller.OrderHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

public class Main {
    private static final int PORT = 8080;
    
    public static void main(String[] args) throws IOException {
        // Use the built-in HttpServer from the JDK
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        
        // Context mapping: all requests starting with /users go to AuthHandler
        server.createContext("/users", new AuthHandler());
        
        // Context mapping: all requests starting with /orders go to OrderHandler
        server.createContext("/orders", new OrderHandler());
        
        // Use a fixed-size thread pool for handling requests
        server.setExecutor(Executors.newFixedThreadPool(10)); 
        
        server.start();

        System.out.println("======================================");
        System.out.println("Local Backend Server started on http://localhost:" + PORT);
        System.out.println("======================================");
        System.out.println("API Routes:");
        System.out.println("  - POST /users/register");
        System.out.println("  - POST /users/login");
        System.out.println("  - GET  /users/profile");
        System.out.println("  - POST /orders/complete");
        System.out.println("  - GET  /orders/history");
        System.out.println("======================================");
    }
}