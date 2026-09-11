let cart = [];


function addToCart(name, price){

    let existing = cart.find(item => item.name === name);

    if(existing){

        existing.quantity++;

    } else {

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

    let cartBox = document.getElementById("cartItems");

    let totalBox = document.getElementById("cartTotal");

    if(!cartBox) return;


    cartBox.innerHTML="";


    let total = 0;


    cart.forEach((item,index)=>{


        total += item.price * item.quantity;


        cartBox.innerHTML += `

        <div class="cart-product">

            <div>
                <strong>${item.name}</strong>
                <br>
               ${item.price} ﷼ x ${item.quantity}
            </div>


            <div>

            <button onclick="changeQuantity(${index},-1)">−</button>

            <span>${item.quantity}</span>

            <button onclick="changeQuantity(${index},1)">+</button>


            <button onclick="removeItem(${index})">
            ✕
            </button>


            </div>

        </div>

        `;


    });


    totalBox.innerHTML = total.toFixed(2) + " ﷼";

}




function changeQuantity(index,value){

    cart[index].quantity += value;


    if(cart[index].quantity <=0){

        cart.splice(index,1);

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
