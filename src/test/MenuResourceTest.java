package com.portfolio;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;

@QuarkusTest
public class MenuResourceTest {

    @Test
    public void testGetMenu() {
        given()
            .when().get("/api/menu")
            .then()
            .statusCode(200)
            .body("size()", is(13)) 
            .body("[0].name", is("Chicken Biryani")); 
    }
}