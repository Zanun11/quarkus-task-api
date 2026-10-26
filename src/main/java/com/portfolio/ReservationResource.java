package com.portfolio;

import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/reservations")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ReservationResource {

    @GET
    public List<Reservation> getReservations() {
        return Reservation.listAll();
    }

    @POST
    @Transactional
    public Response createReservation(Reservation reservation) {
        reservation.persist();
        return Response.status(Response.Status.CREATED).entity(reservation).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response deleteReservation(@PathParam("id") Long id) {
        boolean deleted = Reservation.deleteById(id);
        if (deleted) {
            return Response.noContent().build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }
}