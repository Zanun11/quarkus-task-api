package com.portfolio;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Entity;
import java.time.LocalDateTime;

@Entity
public class Order extends PanacheEntity {
    public String customerName;
    public String customerEmail;
    public String itemsJson; // Stores the food items in JSON format
    public Double totalAmount;
    public String paymentMethod; // "CARD" or "TRANSFER"
    public String status; // "PENDING", "PAID"
    public LocalDateTime orderDate = LocalDateTime.now();
    public String orderReference; // e.g., "ORD-123456"
}