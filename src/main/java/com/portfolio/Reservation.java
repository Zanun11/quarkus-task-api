package com.portfolio;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Entity;

@Entity
public class Reservation extends PanacheEntity {
    public String name;
    public String date;
    public String time;
    public Integer guests;
}