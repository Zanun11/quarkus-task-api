package com.portfolio;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;

@QuarkusTest
public class TaskResourceTest {

    @Test
    public void testCreateAndGetTask() {
        // 1. Send a POST request to create a task
        given()
            .contentType(ContentType.JSON)
            .body("{\"title\": \"Test Task from JUnit\"}")
            .when()
            .post("/tasks")
            .then()
            .statusCode(201); // 201 means "Created"

        // 2. Send a GET request to verify it was saved
        given()
            .when()
            .get("/tasks")
            .then()
            .statusCode(200) // 200 means "OK"
            .body("size()", is(1)) // Check that there is exactly 1 task
            .body("[0].title", is("Test Task from JUnit")); // Check the title matches
    }
}