package com.portfolio;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "customer_order") // Fixes the H2 database "Order" reserved word issue
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