import { db } from "./firebase-config.js";

import {
    doc,
    getDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

const container = document.querySelector("body");


async function loadProduct(){

    if(!productId){
        container.innerHTML = "<h2>Product not found</h2>";
        return;
    }


    try {

        const ref = doc(db, "products", productId);

        const snap = await getDoc(ref);


        if(!snap.exists()){

            container.innerHTML = "<h2>Product not found</h2>";
            return;

        }


        const product = snap.data();


        container.innerHTML = `

        <div style="padding:30px">

            <img src="${product.image}" 
            style="width:300px;max-width:100%">


            <h1>${product.name}</h1>

            <h3>${product.brand || ""}</h3>

            <p>${product.category || ""}</p>

            <h2>${product.price} SAR</h2>


            <button>
            Add To Cart
            </button>

        </div>

        `;


    } catch(error){

        console.error(error);

        container.innerHTML =
        "<h2>Error loading product</h2>";

    }

}


loadProduct();
