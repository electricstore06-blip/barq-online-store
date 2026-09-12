import { initializeApp } from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";


import {
getFirestore,
collection,
addDoc,
getDocs
}
from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


import { firebaseConfig } from "./firebase-config.js";



const app = initializeApp(firebaseConfig);


const db = getFirestore(app);



// ADD PRODUCT

window.addProduct=function(){


let name=document.getElementById("productName").value;

let price=document.getElementById("productPrice").value;

let image=document.getElementById("productImage").value;



addDoc(collection(db,"products"),{

name:name,

price:price,

image:image

})


.then(()=>{

alert("Product Added");

loadProducts();

});


}





// SHOW PRODUCTS


async function loadProducts(){


let box=document.getElementById("productList");


box.innerHTML="";


const querySnapshot=await getDocs(collection(db,"products"));



querySnapshot.forEach((doc)=>{


let p=doc.data();


box.innerHTML+=`

<div>

<h3>${p.name}</h3>

<p>${p.price} ريال</p>

<img width="100" src="${p.image}">


</div>

`;


});


}



loadProducts();
