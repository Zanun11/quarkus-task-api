package com.portfolio;

import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.UUID;

@Path("/api/orders")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class OrderResource {

    @POST
    @Transactional
    public Response createOrder(Order order) {
        // Generate a unique reference like "ORD-A1B2C3"
        order.orderReference = "ORD-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        order.status = "PENDING"; 
        order.persist();
        
        // If payment method is CARD, here is where you would call Stripe's API.
        // If TRANSFER, we just return the order reference.
        
        return Response.status(Response.Status.CREATED).entity(order).build();
    }

    @GET
    public List<Order> getOrders() {
        return Order.listAll();
    }
}