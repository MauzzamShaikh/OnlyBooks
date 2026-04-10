package com.bookstore.repository;

import com.bookstore.model.User;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Updates;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.bson.types.ObjectId;

import java.util.ArrayList;
import java.util.List;

import static com.mongodb.client.model.Filters.eq;

public class UserRepository {
    private final MongoCollection<Document> usersCollection;

    public UserRepository() {
        MongoClient mongoClient = MongoClients.create("mongodb://localhost:27017");
        MongoDatabase database = mongoClient.getDatabase("bookstore");
        usersCollection = database.getCollection("users");
    }

    public Document findByEmail(String email) {
        return usersCollection.find(eq("email", email)).first();
    }

    public Document findById(String userId) {
        try {
            return usersCollection.find(eq("_id", new ObjectId(userId))).first();
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    public ObjectId save(User user) {
        Document doc = new Document("name", user.getName())
                .append("email", user.getEmail())
                .append("passwordHash", user.getPasswordHash())
                .append("bio", user.getBio() != null ? user.getBio() : "")
                .append("createdAt", user.getCreatedAt())
                .append("purchases", new ArrayList<>())
                .append("rentals", new ArrayList<>());

        usersCollection.insertOne(doc);
        ObjectId newId = doc.getObjectId("_id");
        user.setId(newId);
        return newId;
    }
    
    public boolean updateProfile(String userId, String name, String bio) {
        try {
            ObjectId objectId = new ObjectId(userId);
            Bson updates = Updates.combine(
                Updates.set("name", name),
                Updates.set("bio", bio != null ? bio : "")
            );
            usersCollection.updateOne(eq("_id", objectId), updates);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
    
    public boolean updatePassword(String userId, String newPasswordHash) {
        try {
            ObjectId objectId = new ObjectId(userId);
            Bson update = Updates.set("passwordHash", newPasswordHash);
            usersCollection.updateOne(eq("_id", objectId), update);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
    
    public boolean deleteUser(String userId) {
        try {
            ObjectId objectId = new ObjectId(userId);
            usersCollection.deleteOne(eq("_id", objectId));
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
    
    public boolean addOrdersToUser(String userId, List<Document> purchases, List<Document> rentals) {
        try {
            ObjectId objectId = new ObjectId(userId);
            List<Bson> updates = new ArrayList<>();
            
            if (purchases != null && !purchases.isEmpty()) {
                updates.add(Updates.pushEach("purchases", purchases));
            }
            
            if (rentals != null && !rentals.isEmpty()) {
                updates.add(Updates.pushEach("rentals", rentals));
            }
            
            if (updates.isEmpty()) {
                return false;
            }
            
            Bson combinedUpdate = Updates.combine(updates);
            usersCollection.updateOne(eq("_id", objectId), combinedUpdate);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}