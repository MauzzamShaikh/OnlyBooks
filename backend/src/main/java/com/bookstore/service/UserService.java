package com.bookstore.service;

import com.bookstore.model.User;
import com.bookstore.repository.UserRepository;
import org.bson.Document;
import org.mindrot.jbcrypt.BCrypt;

public class UserService {
    private final UserRepository userRepository = new UserRepository();

    public User register(String name, String email, String password) {
        if (userRepository.findByEmail(email) != null) {
            return null; // User already exists
        }
        String hashedPassword = BCrypt.hashpw(password, BCrypt.gensalt(10));
        User newUser = new User();
        newUser.setName(name);
        newUser.setEmail(email);
        newUser.setPasswordHash(hashedPassword);

        userRepository.save(newUser);
        return newUser;
    }

    public Document login(String email, String password) {
        Document userDoc = userRepository.findByEmail(email);

        if (userDoc == null) return null;

        String storedHash = userDoc.getString("passwordHash");
        
        if (BCrypt.checkpw(password, storedHash)) {
            userDoc.remove("passwordHash");
            return userDoc;
        } else {
            return null;
        }
    }

    public Document getProfile(String userId) {
        Document userDoc = userRepository.findById(userId);
        if (userDoc != null) {
            userDoc.remove("passwordHash");
        }
        return userDoc;
    }

    /**
     * Updates the user's password after verifying the current one.
     * @param userId The ID of the user.
     * @param currentPassword The user's current password.
     * @param newPassword The user's new password.
     * @return true if the password was successfully updated, false otherwise (e.g., current password incorrect or user not found).
     */
    public boolean updatePassword(String userId, String currentPassword, String newPassword) {
        Document userDoc = userRepository.findById(userId);

        if (userDoc == null) {
            return false; // User not found
        }

        String storedHash = userDoc.getString("passwordHash");

        // 1. Verify the current password
        if (BCrypt.checkpw(currentPassword, storedHash)) {
            // 2. Hash the new password
            String newHashedPassword = BCrypt.hashpw(newPassword, BCrypt.gensalt(10));
            
            // 3. Update the password in the repository
            return userRepository.updatePassword(userId, newHashedPassword);
        } else {
            return false; // Current password incorrect
        }
    }
}