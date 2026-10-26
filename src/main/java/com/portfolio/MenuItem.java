package com.portfolio;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Entity;

@Entity
public class MenuItem extends PanacheEntity {
    public String name;
    public String category;
    public Double price;
    public String description;
    public String emoji; 
    public String tag;
    public String img;
}