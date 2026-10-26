package com.portfolio;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

@Path("/api/menu")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
public class MenuResource {

    @GET
    public List<MenuItem> getMenu() {
        return MenuItem.listAll();
    }

    @Transactional
    void onStart(@Observes StartupEvent ev) {
                    if (MenuItem.count() == 0) {
            MenuItem m1 = new MenuItem();
            m1.name = "Chicken Biryani"; m1.category = "Biryani & Rice"; m1.price = 12.5; 
            m1.description = "Aromatic rice with perfectly spiced chicken."; m1.emoji = "🍚"; m1.tag = "Most loved";
            m1.img = "images/biryani.jpg"; m1.persist();

            MenuItem m2 = new MenuItem();
            m2.name = "Whole Chicken Mandi Rice"; m2.category = "Biryani & Rice"; m2.price = 14.0; 
            m2.description = "Traditional mandi taste — whole chicken over fragrant rice."; m2.emoji = "🍗"; m2.tag = "Traditional";
            m2.img = "images/mandi-rice.jpg"; m2.persist();

            MenuItem m3 = new MenuItem();
            m3.name = "Chicken Karahi"; m3.category = "Karahi & Curry"; m3.price = 12.5; 
            m3.description = "Rich, spicy and full of taste, served with fresh lemon."; m3.emoji = "🍛"; m3.tag = "Specialty";
            m3.img = "images/karahi.jpg"; m3.persist();

            MenuItem m4 = new MenuItem();
            m4.name = "Shami Kababs"; m4.category = "Kababs & BBQ"; m4.price = 8.0; 
            m4.description = "Soft, juicy kababs full of flavour. 100% halal."; m4.emoji = "🧆"; m4.tag = "100% Halal";
            m4.img = "images/kababs.jpg"; m4.persist();

            MenuItem m5 = new MenuItem();
            m5.name = "Chicken Pakoras + Chutney"; m5.category = "Kababs & BBQ"; m5.price = 7.0; 
            m5.description = "Crispy fried chicken pieces with homemade green chutney."; m5.emoji = "🍗"; m5.tag = "Crispy";
            m5.img = "images/pakoras.jpg"; m5.persist();

            MenuItem m6 = new MenuItem();
            m6.name = "Chicken, Chips & Rice Platter"; m6.category = "Kababs & BBQ"; m6.price = 10.0; 
            m6.description = "Quarter roast chicken, fries, pilau rice, salad and lemon."; m6.emoji = "🍟"; m6.tag = "Great value";
            m6.img = "images/platter.jpg"; m6.persist();

            MenuItem m7 = new MenuItem();
            m7.name = "Homemade Halal Pizza"; m7.category = "Pizza & Breads"; m7.price = 11.0; 
            m7.description = "Fresh homemade halal pizza with your choice of toppings."; m7.emoji = "🍕"; m7.tag = "Fresh";
            m7.img = "images/pizza.jpg"; m7.persist();

            MenuItem m8 = new MenuItem();
            m8.name = "Alu Cheese Naan"; m8.category = "Pizza & Breads"; m8.price = 4.5; 
            m8.description = "Stuffed potato and cheese naan — soft, golden, homemade."; m8.emoji = "🫓"; m8.tag = "Homemade";
            m8.img = "images/naan.jpg"; m8.persist();

            MenuItem m9 = new MenuItem();
            m9.name = "Frozen Parathas"; m9.category = "Frozen & Takeaway"; m9.price = 6.0; 
            m9.description = "Homemade, soft and flaky. Ready to cook at home."; m9.emoji = "🥞"; m9.tag = "Frozen pack";
            m9.img = "images/parathas.jpg"; m9.persist();

            MenuItem m10 = new MenuItem();
            m10.name = "Frozen Samosas & Rolls"; m10.category = "Frozen & Takeaway"; m10.price = 5.5; 
            m10.description = "Chicken samosas and spring rolls in labelled freezer packs."; m10.emoji = "🥟"; m10.tag = "Frozen pack";
            m10.img = "images/frozen-packs.jpg"; m10.persist();

            MenuItem m11 = new MenuItem();
            m11.name = "Puff Pastries"; m11.category = "Frozen & Takeaway"; m11.price = 5.0; 
            m11.description = "Different types — fresh cooked or frozen to bake at home."; m11.emoji = "🥐"; m11.tag = "Fresh & frozen";
            m11.img = "images/pastries.jpg"; m11.persist();

            MenuItem m12 = new MenuItem();
            m12.name = "Kheer Dessert"; m12.category = "Desserts & Chai"; m12.price = 4.0; 
            m12.description = "Creamy homemade kheer topped with almonds and pistachio."; m12.emoji = "🍨"; m12.tag = "Homemade";
            m12.img = "images/kheer.jpg"; m12.persist();

            MenuItem m13 = new MenuItem();
            m13.name = "Dhood Pati Chaii Flask"; m13.category = "Desserts & Chai"; m13.price = 16.0; 
            m13.description = "Best chaii in Wolverhampton. Offer price, was £20 a flask."; m13.emoji = "🫖"; m13.tag = "Offer";
            m13.img = "images/chai.jpg"; m13.persist();
        }
    }
}