package com.bookstore.model;

import org.bson.types.ObjectId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class User {
    private ObjectId _id;
    private String name;
    private String email;
    private String passwordHash; 
    private String bio;
    private Date createdAt;
    private List<Purchase> purchases;
    private List<Rental> rentals;

    public User() { 
        this.createdAt = new Date();
        this.purchases = new ArrayList<>();
        this.rentals = new ArrayList<>();
        this.bio = "";
    }
    
    // Getters and Setters
    public ObjectId getId() { return _id; }
    public void setId(ObjectId _id) { this._id = _id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
    
    public List<Purchase> getPurchases() { return purchases; }
    public void setPurchases(List<Purchase> purchases) { this.purchases = purchases; }
    
    public List<Rental> getRentals() { return rentals; }
    public void setRentals(List<Rental> rentals) { this.rentals = rentals; }
    
    // Inner classes for Purchase and Rental
    public static class Purchase {
        private String bookId;
        private String bookTitle;
        private String bookAuthor;
        private double price;
        private Date purchaseDate;
        
        public Purchase() {}
        
        public Purchase(String bookId, String bookTitle, String bookAuthor, double price) {
            this.bookId = bookId;
            this.bookTitle = bookTitle;
            this.bookAuthor = bookAuthor;
            this.price = price;
            this.purchaseDate = new Date();
        }
        
        // Getters and Setters
        public String getBookId() { return bookId; }
        public void setBookId(String bookId) { this.bookId = bookId; }
        
        public String getBookTitle() { return bookTitle; }
        public void setBookTitle(String bookTitle) { this.bookTitle = bookTitle; }
        
        public String getBookAuthor() { return bookAuthor; }
        public void setBookAuthor(String bookAuthor) { this.bookAuthor = bookAuthor; }
        
        public double getPrice() { return price; }
        public void setPrice(double price) { this.price = price; }
        
        public Date getPurchaseDate() { return purchaseDate; }
        public void setPurchaseDate(Date purchaseDate) { this.purchaseDate = purchaseDate; }
    }
    
    public static class Rental {
        private String bookId;
        private String bookTitle;
        private String bookAuthor;
        private double price;
        private int durationDays;
        private Date rentalDate;
        private Date expiryDate;
        
        public Rental() {}
        
        public Rental(String bookId, String bookTitle, String bookAuthor, double price, int durationDays) {
            this.bookId = bookId;
            this.bookTitle = bookTitle;
            this.bookAuthor = bookAuthor;
            this.price = price;
            this.durationDays = durationDays;
            this.rentalDate = new Date();
            
            // Calculate expiry date
            long expiryTime = this.rentalDate.getTime() + (durationDays * 24L * 60L * 60L * 1000L);
            this.expiryDate = new Date(expiryTime);
        }
        
        // Getters and Setters
        public String getBookId() { return bookId; }
        public void setBookId(String bookId) { this.bookId = bookId; }
        
        public String getBookTitle() { return bookTitle; }
        public void setBookTitle(String bookTitle) { this.bookTitle = bookTitle; }
        
        public String getBookAuthor() { return bookAuthor; }
        public void setBookAuthor(String bookAuthor) { this.bookAuthor = bookAuthor; }
        
        public double getPrice() { return price; }
        public void setPrice(double price) { this.price = price; }
        
        public int getDurationDays() { return durationDays; }
        public void setDurationDays(int durationDays) { this.durationDays = durationDays; }
        
        public Date getRentalDate() { return rentalDate; }
        public void setRentalDate(Date rentalDate) { this.rentalDate = rentalDate; }
        
        public Date getExpiryDate() { return expiryDate; }
        public void setExpiryDate(Date expiryDate) { this.expiryDate = expiryDate; }
    }
}