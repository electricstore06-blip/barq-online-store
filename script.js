let cart = [];


function addToCart(name, price){

    let existing = cart.find(item => item.name === name);

    if(existing){

        existing.quantity++;

    }else{

        cart.push({
            name:name,
            price:price,
            quantity:1,
            image:getProductImage(name)
        });

    }

    updateCart();

}



function getProductImage(name){

    if(name==="Lipstick"){
        return "https://images.unsplash.com/photo-1586495777744-4413f21062fa";
    }


    if(name==="Beauty Kit"){
        return "https://images.unsplash.com/photo-1596462502278-27bfdc403348";
    }


    if(name==="Skin Care"){
        return "https://images.unsplash.com/photo-1556228578-8c89e6adf883";
    }


    return "";

}



function updateCart(){

    let cartItems = document.getElementById("cartItems");

    let total = 0;

    cartItems.innerHTML = "";


    cart.forEach((item,index)=>{

        total += item.price * item.quantity;


        cartItems.innerHTML += `

        <div class="cart-product">

            <div>
                <strong>${item.name}</strong>
                <br>
                $${item.price} x ${item.quantity}
            </div>


            <div>

                <button onclick="decreaseQty(${index})">−</button>

                <button onclick="increaseQty(${index})">+</button>

                <button onclick="removeItem(${index})">✕</button>

            </div>

        </div>

        `;

    });


    document.getElementById("cartTotal").innerHTML =
    "Total: $" + total.toFixed(2);

}



function increaseQty(index){

    cart[index].quantity++;

    updateCart();

}



function decreaseQty(index){

    if(cart[index].quantity > 1){

        cart[index].quantity--;

    }

    updateCart();

}



function removeItem(index){

    cart.splice(index,1);

    updateCart();

}



function openCart(){

    document.querySelector(".cart-box").style.display="block";

}



function closeCart(){

    document.querySelector(".cart-box").style.display="none";

}
