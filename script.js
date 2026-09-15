class Product
{

    #id;

    #name;

    #category;

    #type;

    #price;

    #sizes;

    #description;

    constructor(
        id,
        name,
        category,
        type,
        price,
        sizes,
        description
    ) {
        this.#id = id;
        this.#name = name;
        this.#category = category;
        this.#type = type;
        this.#price = price;
        this.#sizes = sizes;
        this.#description = description;
    }

    // Getters provide controlled access
    // to the private data
    get id() {
        return this.#id;
    }

    get name() {
        return this.#name;
    }

    get category() {
        return this.#category;
    }

    get type() {
        return this.#type;
    }

    get price() {
        return this.#price;
    }

    get sizes() {
        return this.#sizes;
    }

    get description() {
        return this.#description;
    }

    getInfo() {
        return `${this.#name} - ₱${this.#price}`;
    }
}

//inheritance part
// TextShirt inherits from Product
class TextShirt extends Product
{
    constructor(
        id,
        name,
        category,
        price,
        sizes,
        description
    ) {
        super(
            id,
            name,
            category,
            "Text",
            price,
            sizes,
            description
        );
    }

    // POLYMORPHISM
    // This method behaves differently
    // from the Product version
    getInfo() {
        return `Text Shirt: ${this.name} - ₱${this.price}`;
    }
}

// GraphicShirt also inherits from Product
class GraphicShirt extends Product
{
    constructor(
        id,
        name,
        category,
        price,
        sizes,
        description
    ) {
        super(
            id,
            name,
            category,
            "Graphic",
            price,
            sizes,
            description
        );
    }

    getInfo() {
        return `Graphic Shirt: ${this.name} - ₱${this.price}`;
    }
}

class CartItem
{
    constructor(product, quantity = 1) {
        this.product = product;
        this.quantity = quantity;
    }

    getSubtotal() {
        return this.product.price * this.quantity;
    }
}

//Cart class
class Cart
{
    // ENCAPSULATION!!!!!!!!!!
    #items = [];

    addProduct(product)
    {
        const existingItem =
            this.#items.find(
                item =>
                    item.product.id === product.id
            );

        if (existingItem) {
            existingItem.quantity++;
        } else {
            this.#items.push(
                new CartItem(product)
            );
        }
    }

    updateQuantity(productId, change) {
        const item =
            this.#items.find(
                item =>
                    item.product.id === productId
            );

        if (!item) {
            return;
        }

        item.quantity += change;

        if (item.quantity <= 0) {
            this.#items =
                this.#items.filter(
                    item =>
                        item.product.id !== productId
                );
        }
    }

    // Return a copy of the array
    // instead of exposing the private array
    getItems() {
        return [...this.#items];
    }

    getTotal() {
        return this.#items.reduce(
            (total, item) =>
                total + item.getSubtotal(),
            0
        );
    }

    getCount() {
        return this.#items.reduce(
            (count, item) =>
                count + item.quantity,
            0
        );
    }
}

//Customer Class
class Customer
{
    constructor(name, email, address) {
        this.name = name;
        this.email = email;
        this.address = address;
    }
}

//Order Class
class Order
{
    constructor(
        customer,
        items,
        total,
        paymentMethod
    ) {
        this.customer = customer;
        this.items = items;
        this.total = total;
        this.paymentMethod = paymentMethod;
        this.date = new Date();
    }
}

//Dataa
let products = [];

const cart = new Cart();

//Fetch API
async function loadProducts()
{
    try {
        const response =
            await fetch("products.json");

        if (!response.ok) {
            throw new Error(
                "Failed to load products."
            );
        }

        const data =
            await response.json();

        // Map
        // Convert JSON objects into
        // JavaScript Product objects ??
        products = data.map(item => {
            let product;

            if (item.type === "Text") {
                product = new TextShirt(
                    item.id,
                    item.name,
                    item.category,
                    item.price,
                    item.sizes,
                    item.description
                );
            } else if (item.type === "Graphic") {
                product = new GraphicShirt(
                    item.id,
                    item.name,
                    item.category,
                    item.price,
                    item.sizes,
                    item.description
                );
            } else {
                product = new Product(
                    item.id,
                    item.name,
                    item.category,
                    item.type,
                    item.price,
                    item.sizes,
                    item.description
                );
            }

            // Keep the existing Product classes and methods intact.
            // The image is an additional display property loaded from JSON.
            product.image = item.image || "";

            return product;
        });

        document.getElementById("loading")
            .style.display = "none";

        renderProducts(products);

        // If a product was added from product.html, use the existing
        // Cart.addProduct() method to place it in the cart.
        const pending = sessionStorage.getItem("threadlinePendingCart");

        if (pending) {
            try {
                const selection = JSON.parse(pending);
                const pendingProduct = products.find(
                    product => product.id === Number(selection.productId)
                );

                if (pendingProduct) {
                    const amount = Math.max(
                        1,
                        Math.min(10, Number(selection.quantity) || 1)
                    );

                    for (let i = 0; i < amount; i++) {
                        cart.addProduct(pendingProduct);
                    }

                    renderCart();
                }

                sessionStorage.removeItem("threadlinePendingCart");
            } catch (pendingError) {
                console.error(pendingError);
                sessionStorage.removeItem("threadlinePendingCart");
            }
        }

        if (new URLSearchParams(window.location.search).get("openCart") === "1") {
            document.getElementById("cartModal").classList.remove("hidden");
        }

    } catch (error) {
        document.getElementById("loading")
            .textContent =
            "Unable to load products.";

        console.error(error);
    }
}

//For in
function showProductDetails(product)
{
    let details = "";

    // Loops through the properties
    // of a JavaScript object
    for (const key in product) {
        details +=
            `${key}: ${product[key]}\n`;
    }

    console.log(details);
}

//Display
function renderProducts(productList)
{
    const container =
        document.getElementById("productList");

    container.innerHTML = "";

    if (productList.length === 0) {
        container.innerHTML =
            "<p>No products found.</p>";
        return;
    }

    // FOREACH
    // Creates a product card for
    // every product
    productList.forEach(product => {
        const card =
            document.createElement("div");

        card.className =
            "product-card";

        card.dataset.id = product.id;
        card.setAttribute("role", "link");
        card.setAttribute("tabindex", "0");

        const image = product.image || "";

        card.innerHTML = `
            <div class="product-image">
                ${
                    image
                        ? `<img src="${image}" alt="${product.name}" onerror="this.style.display='none'; this.parentElement.classList.add('image-fallback');">`
                        : `<span class="image-placeholder">PRODUCT</span>`
                }
                <span class="image-badge">${product.category}</span>
            </div>
            <span class="category">
                ${product.category}
            </span>
            <h3>
                ${product.name}
            </h3>
            <p>
                ${product.description}
            </p>
            <p class="price">
                ₱${product.price.toLocaleString()}
            </p>
            <button
                class="add-button"
                data-id="${product.id}">
                ADD TO BAG
            </button>
        `;

        container.appendChild(card);
    });
}

//search filter
function filterProducts()
{
    const search =
        document.getElementById("searchInput")
            .value
            .toLowerCase();

    const category =
        document.getElementById("categoryFilter")
            .value;

    // FILTER
    // Keeps only products that match.
    const filteredProducts =
        products
            .filter(product =>
                product.name
                    .toLowerCase()
                    .includes(search)
            )
            .filter(product =>
                category === "All" ||
                product.category === category
            );

    renderProducts(filteredProducts);
}

//Cart Display
function renderCart()
{
    const container =
        document.getElementById("cartItems");

    container.innerHTML = "";

    const items =
        cart.getItems();

    if (items.length === 0) {
        container.innerHTML =
            "<p>Your cart is empty.</p>";
    } else {
        items.forEach(item => {
            const row =
                document.createElement("div");

            row.className =
                "cart-item";

            row.innerHTML = `
                <div>
                    <strong>
                        ${item.product.name}
                    </strong>
                    <br>
                    ₱${item.getSubtotal()}
                </div>

                <div class="quantity">
                    <button
                        data-action="decrease"
                        data-id="${item.product.id}">
                        −
                    </button>

                    ${item.quantity}

                    <button
                        data-action="increase"
                        data-id="${item.product.id}">
                        +
                    </button>
                </div>
            `;

            container.appendChild(row);
        });
    }

    document.getElementById("cartTotal")
        .textContent =
        cart.getTotal();

    document.getElementById("cartCount")
        .textContent =
        cart.getCount();
}

//Event delegation
document.getElementById("productList")
    .addEventListener(
        "click",
        event => {
            if (
                event.target
                    .classList
                    .contains("add-button")
            ){
                const id =
                    Number(
                        event.target
                            .dataset
                            .id
                    );

                // Find
                // Locate the selected product
                const product =
                    products.find(
                        product =>
                            product.id === id
                    );

                if (product) {
                    cart.addProduct(product);
                    renderCart();
                    showProductDetails(product);

                    alert(
                        `${product.name} added to cart!`
                    );
                }

                return;
            }

            // Clicking anywhere else on a product card opens
            // the full product page.
            const card = event.target.closest(".product-card");

            if (card) {
                const id = Number(card.dataset.id);
                window.location.href = `product.html?id=${id}`;
            }
        }
    );

document.getElementById("productList")
    .addEventListener(
        "keydown",
        event => {
            if (event.key !== "Enter" && event.key !== " ") {
                return;
            }

            const card = event.target.closest(".product-card");

            if (card && !event.target.classList.contains("add-button")) {
                event.preventDefault();
                const id = Number(card.dataset.id);
                window.location.href = `product.html?id=${id}`;
            }
        }
    );

document.getElementById("cartItems")
    .addEventListener(
        "click",
        event => {
            const id =
                Number(
                    event.target.dataset.id
                );

            const action =
                event.target.dataset.action;

            if (action === "increase") {
                cart.updateQuantity(id, 1);
            }

            if (action === "decrease") {
                cart.updateQuantity(id, -1);
            }

            renderCart();
        }
    );

document.getElementById("searchInput")
    .addEventListener(
        "input",
        filterProducts
    );

document.getElementById("categoryFilter")
    .addEventListener(
        "change",
        filterProducts
    );

document.getElementById("cartButton")
    .addEventListener(
        "click",
        () => {
            renderCart();

            document.getElementById("cartModal")
                .classList
                .remove("hidden");
        }
    );

document.getElementById("closeCart")
    .addEventListener(
        "click",
        () => {
            document.getElementById("cartModal")
                .classList
                .add("hidden");
        }
    );

document.getElementById("checkoutButton")
    .addEventListener(
        "click",
        () => {
            if (
                cart.getItems().length === 0
            ) {
                alert(
                    "Your cart is empty."
                );
                return;
            }

            document.getElementById("cartModal")
                .classList
                .add("hidden");

            document.getElementById("checkoutModal")
                .classList
                .remove("hidden");
        }
    );

document.getElementById("closeCheckout")
    .addEventListener(
        "click",
        () => {
            document.getElementById("checkoutModal")
                .classList
                .add("hidden");
        }
    );

document.getElementById("checkoutForm")
    .addEventListener(
        "submit",
        event => {
            event.preventDefault();

            const name =
                document.getElementById(
                    "customerName"
                ).value.trim();

            const email =
                document.getElementById(
                    "customerEmail"
                ).value.trim();

            const address =
                document.getElementById(
                    "customerAddress"
                ).value.trim();

            const payment =
                document.getElementById(
                    "paymentMethod"
                ).value;

            if (
                !name ||
                !email ||
                !address ||
                !payment
            ) {
                alert(
                    "Please complete all fields."
                );
                return;
            }

            const customer =
                new Customer(
                    name,
                    email,
                    address
                );

            const order =
                new Order(
                    customer,
                    cart.getItems(),
                    cart.getTotal(),
                    payment
                );

            alert(
                `Order placed successfully!\n\n` +
                `Customer: ${order.customer.name}\n` +
                `Total: ₱${order.total}\n` +
                `Payment: ${order.paymentMethod}`
            );

            document.getElementById(
                "checkoutForm"
            ).reset();

            document.getElementById(
                "checkoutModal"
            ).classList.add("hidden");
        }
    );

loadProducts();