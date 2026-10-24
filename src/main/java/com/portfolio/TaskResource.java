package com.portfolio;

import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/tasks")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TaskResource {

    @GET
    public List<Task> getTasks() {
        return Task.listAll();
    }

    @POST
    @Transactional
    public Response createTask(Task task) {
        task.persist();
        return Response.status(Response.Status.CREATED).entity(task).build(); 
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Task updateTask(@PathParam("id") Long id, Task taskUpdate) {
        Task entity = Task.findById(id);
        if (entity == null) {
            throw new WebApplicationException("Task with id " + id + " does not exist.", 404);
        }
        entity.title = taskUpdate.title;
        entity.completed = taskUpdate.completed;
        return entity;
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public void deleteTask(@PathParam("id") Long id) {
        Task.deleteById(id);
    }
}