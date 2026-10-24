package com.portfolio;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Entity;

@Entity
public class Task extends PanacheEntity {
    public String title;
    public boolean completed;

    // A default constructor is required by Hibernate
    public Task() {
    }

    public Task(String title) {
        this.title = title;
        this.completed = false;
    }
}