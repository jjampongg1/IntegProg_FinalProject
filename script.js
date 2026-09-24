class Product
{
    #id;
    #name;
    #category;
    #type;
    #price;
    #sizes;
    #description;
    constructor(id, name, category, type, price, sizes, description)
    {
        this.#id = id;
        this.#name = name;
        this.#category = category;
        this.#type = type;
        this.#price = price;
        this.#sizes = sizes;
        this.#description = description;
    }
    get id() { return this.#id; }
    get name() { return this.#name; }
    get category() { return this.#category; }
    get type() { return this.#type; }
    get price() { return this.#price; }
    get sizes() { return this.#sizes; }
    get description() { return this.#description; }
    getInfo()
    {
        return `${this.#name} - ₱${this.#price}`;
    }
}
// INHERITANCE
class TextShirt extends Product
{
    constructor(id, name, category, price, sizes, description)
    {
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
    getInfo()
    {
        return `Text Shirt: ${this.name} - ₱${this.price}`;
    }
}
// INHERITANCE + POLYMORPHISM
class GraphicShirt extends Product
{
    constructor(id, name, category, price, sizes, description)
    {
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
    getInfo()
    {
        return `Graphic Shirt: ${this.name} - ₱${this.price}`;
    }
}
class CartItem
{
    constructor(product, quantity = 1)
    {
        this.product = product;
        this.quantity = quantity;
    }
    getSubtotal()
    {
        return this.product.price * this.quantity;
    }
}
// CART CLASS
class Cart
{
    // ENCAPSULATION
    #items = [];
    static STORAGE_KEY = "techkeep_cart";
    addProduct(product)
    {
        const existingItem =
            this.#items.find(
                item => item.product.id === product.id
            );
        if (existingItem)
        {
            existingItem.quantity++;
        }
        else
        {
            this.#items.push(
                new CartItem(product)
            );
        }
        this.saveCart();
    }
    updateQuantity(productId, change)
    {
        const item =
            this.#items.find(
                item => item.product.id === productId
            );
        if (!item)
        {
            return;
        }
        item.quantity += change;
        if (item.quantity <= 0)
        {
            this.#items =
                this.#items.filter(
                    item => item.product.id !== productId
                );
        }
        this.saveCart();
    }
    removeProduct(productId)
    {
        this.#items =
            this.#items.filter(
                item => item.product.id !== productId
            );
        this.saveCart();
    }
    saveCart()
    {
        const savedItems =
            this.#items.map(item => ({
                productId: item.product.id,
                quantity: item.quantity
            }));
        localStorage.setItem(
            Cart.STORAGE_KEY,
            JSON.stringify(savedItems)
        );
    }
    restoreCart(productList)
    {
        const savedCart =
            localStorage.getItem(Cart.STORAGE_KEY);
        if (!savedCart)
        {
            return;
        }
        try
        {
            const savedItems = JSON.parse(savedCart);
            this.#items = [];
            savedItems.forEach(savedItem =>
            {
                const product =
                    productList.find(
                        product =>
                            product.id ===
                            Number(savedItem.productId)
                    );
                if (product)
                {
                    const quantity =
                        Math.max(
                            1,
                            Number(savedItem.quantity) || 1
                        );
                    this.#items.push(
                        new CartItem(product, quantity)
                    );
                }
            });
        }
        catch (error)
        {
            console.error(
                "Unable to restore cart:",
                error
            );
            localStorage.removeItem(
                Cart.STORAGE_KEY
            );
        }
    }
    clear()
    {
        this.#items = [];
        localStorage.removeItem(
            Cart.STORAGE_KEY
        );
    }
    // Return a copy instead of exposing private data
    getItems()
    {
        return [...this.#items];
    }
    getTotal()
    {
        return this.#items.reduce(
            (total, item) =>
                total + item.getSubtotal(),
            0
        );
    }
    getCount()
    {
        return this.#items.reduce(
            (count, item) =>
                count + item.quantity,
            0
        );
    }
}
// CUSTOMER CLASS
class Customer
{
    constructor(name, email, address)
    {
        this.name = name;
        this.email = email;
        this.address = address;
    }
}
// ORDER CLASS
class Order
{
    constructor(customer, items, total, paymentMethod)
    {
        this.customer = customer;
        this.items = items;
        this.total = total;
        this.paymentMethod = paymentMethod;
        this.date = new Date();
    }
}
// DATA
let products = [];
const cart = new Cart();
// FETCH API
async function loadProducts()
{
    try
    {
        const response =
            await fetch("products.json");
        if (!response.ok)
        {
            throw new Error(
                "Failed to load products."
            );
        }
        const data =
            await response.json();
        // Convert JSON data into Product objects
        products = data.map(item =>
        {
            let product;
            if (item.type === "Text")
            {
                product = new TextShirt(
                    item.id,
                    item.name,
                    item.category,
                    item.price,
                    item.sizes,
                    item.description
                );
            }
            else if (item.type === "Graphic")
            {
                product = new GraphicShirt(
                    item.id,
                    item.name,
                    item.category,
                    item.price,
                    item.sizes,
                    item.description
                );
            }
            else
            {
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
            // Image is a display property from JSON.
            product.image = item.image || "";
            return product;
        });
        document.getElementById("loading")
            .style.display = "none";
        // Restore today's saved cart after products exist.
        cart.restoreCart(products);
        renderProducts(products);
        renderCart();
        // Product-page pending cart support
        const pending =
            sessionStorage.getItem(
                "threadlinePendingCart"
            );
        if (pending)
        {
            try
            {
                const selection =
                    JSON.parse(pending);
                const pendingProduct =
                    products.find(
                        product =>
                            product.id ===
                            Number(selection.productId)
                    );
                if (pendingProduct)
                {
                    const amount =
                        Math.max(
                            1,
                            Math.min(
                                10,
                                Number(selection.quantity) || 1
                            )
                        );
                    for (let i = 0; i < amount; i++)
                    {
                        cart.addProduct(
                            pendingProduct
                        );
                    }
                    renderCart();
                }
                sessionStorage.removeItem(
                    "threadlinePendingCart"
                );
            }
            catch (pendingError)
            {
                console.error(pendingError);
                sessionStorage.removeItem(
                    "threadlinePendingCart"
                );
            }
        }
        if (
            new URLSearchParams(
                window.location.search
            ).get("openCart") === "1"
        )
        {
            document.getElementById("cartModal")
                .classList.remove("hidden");
        }
    }
    catch (error)
    {
        document.getElementById("loading")
            .textContent =
            "Unable to load products.";
        console.error(error);
    }
}
// FOR...IN DEMONSTRATION
function showProductDetails(product)
{
    let details = "";
    for (const key in product)
    {
        details +=
            `${key}: ${product[key]}\n`;
    }
    console.log(details);
}
// DISPLAY PRODUCTS
function renderProducts(productList)
{
    const container =
        document.getElementById("productList");
    container.innerHTML = "";
    if (productList.length === 0)
    {
        container.innerHTML =
            "<p>No products found.</p>";
        return;
    }
    // FOREACH
    productList.forEach(product =>
    {
        const card =
            document.createElement("div");
        card.className = "product-card";
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
// SEARCH + CATEGORY FILTER
function filterProducts()
{
    const search =
        document.getElementById("searchInput")
            .value
            .toLowerCase();
    const category =
        document.getElementById("categoryFilter")
            .value;
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
// CART DISPLAY
function renderCart()
{
    const container =
        document.getElementById("cartItems");
    container.innerHTML = "";
    const items = cart.getItems();
    if (items.length === 0)
    {
        container.innerHTML =
            "<p>Your cart is empty.</p>";
    }
    else
    {
        items.forEach(item =>
        {
            const row =
                document.createElement("div");
            row.className = "cart-item";
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
                    <button
                        class="remove-cart-item"
                        data-action="remove"
                        data-id="${item.product.id}">
                        REMOVE
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
// PRODUCT LIST CLICK EVENTS
document.getElementById("productList")
    .addEventListener(
        "click",
        event =>
        {
            if (
                event.target.classList.contains(
                    "add-button"
                )
            )
            {
                const id =
                    Number(
                        event.target.dataset.id
                    );
                const product =
                    products.find(
                        product =>
                            product.id === id
                    );
                if (product)
                {
                    cart.addProduct(product);
                    renderCart();
                    showProductDetails(product);
                    alert(
                        `${product.name} added to cart!`
                    );
                }
                return;
            }
            const card =
                event.target.closest(
                    ".product-card"
                );
            if (card)
            {
                const id =
                    Number(card.dataset.id);
                window.location.href =
                    `product.html?id=${id}`;
            }
        }
    );
// PRODUCT CARD KEYBOARD ACCESS
document.getElementById("productList")
    .addEventListener(
        "keydown",
        event =>
        {
            if (
                event.key !== "Enter" &&
                event.key !== " "
            )
            {
                return;
            }
            const card =
                event.target.closest(
                    ".product-card"
                );
            if (
                card &&
                !event.target.classList.contains(
                    "add-button"
                )
            )
            {
                event.preventDefault();
                const id =
                    Number(card.dataset.id);
                window.location.href =
                    `product.html?id=${id}`;
            }
        }
    );
// CART ITEM CONTROLS
document.getElementById("cartItems")
    .addEventListener(
        "click",
        event =>
        {
            const id =
                Number(
                    event.target.dataset.id
                );
            const action =
                event.target.dataset.action;
            if (action === "increase")
            {
                cart.updateQuantity(id, 1);
            }
            if (action === "decrease")
            {
                cart.updateQuantity(id, -1);
            }
            if (action === "remove")
            {
                cart.removeProduct(id);
            }
            renderCart();
        }
    );
// SEARCH
document.getElementById("searchInput")
    .addEventListener(
        "input",
        filterProducts
    );
// CATEGORY FILTER
document.getElementById("categoryFilter")
    .addEventListener(
        "change",
        filterProducts
    );
// OPEN CART
document.getElementById("cartButton")
    .addEventListener(
        "click",
        () =>
        {
            renderCart();
            document.getElementById("cartModal")
                .classList
                .remove("hidden");
        }
    );
// CLOSE CART
document.getElementById("closeCart")
    .addEventListener(
        "click",
        () =>
        {
            document.getElementById("cartModal")
                .classList
                .add("hidden");
        }
    );
// OPEN CHECKOUT
document.getElementById("checkoutButton")
    .addEventListener(
        "click",
        () =>
        {
            if (cart.getItems().length === 0)
            {
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
// CLOSE CHECKOUT
document.getElementById("closeCheckout")
    .addEventListener(
        "click",
        () =>
        {
            document.getElementById("checkoutModal")
                .classList
                .add("hidden");
        }
    );
// CHECKOUT VALIDATION AND FEEDBACK
const checkoutForm =
    document.getElementById(
        "checkoutForm"
    );
const customerNameInput =
    document.getElementById(
        "customerName"
    );
const customerEmailInput =
    document.getElementById(
        "customerEmail"
    );
const customerAddressInput =
    document.getElementById(
        "customerAddress"
    );
const paymentMethodInput =
    document.getElementById(
        "paymentMethod"
    );
// Clear custom validation messages as the user corrects each field.
[
    customerNameInput,
    customerEmailInput,
    customerAddressInput,
    paymentMethodInput
].forEach(input =>
{
    input.addEventListener(
        "input",
        () =>
        {
            input.setCustomValidity("");
        }
    );
    input.addEventListener(
        "change",
        () =>
        {
            input.setCustomValidity("");
        }
    );
});
// CHECKOUT FORM
checkoutForm.addEventListener(
    "submit",
    event =>
    {
        event.preventDefault();
        // Prevent checkout without products.
        if (cart.getItems().length === 0)
        {
            alert(
                "Checkout cannot continue because your cart is empty."
            );
            return;
        }
        const name =
            customerNameInput.value.trim();
        const email =
            customerEmailInput.value.trim();
        const address =
            customerAddressInput.value.trim();
        const payment =
            paymentMethodInput.value;
        // Clear previous custom validation messages.
        customerNameInput.setCustomValidity("");
        customerEmailInput.setCustomValidity("");
        customerAddressInput.setCustomValidity("");
        paymentMethodInput.setCustomValidity("");
        // Custom checkout validation.
        if (name.length < 2)
        {
            customerNameInput.setCustomValidity(
                "Please enter your full name."
            );
        }
        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email))
        {
            customerEmailInput.setCustomValidity(
                "Please enter a valid email address."
            );
        }
        if (address.length < 10)
        {
            customerAddressInput.setCustomValidity(
                "Please enter a complete delivery address."
            );
        }
        if (!payment)
        {
            paymentMethodInput.setCustomValidity(
                "Please select a payment method."
            );
        }
        // Show browser validation feedback if any field is invalid.
        if (!checkoutForm.checkValidity())
        {
            checkoutForm.reportValidity();
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
        console.log(
            "Order placed:",
            order
        );
        // Success feedback.
        alert(
            `Order placed successfully!\n\n` +
            `Thank you, ${order.customer.name}!\n` +
            `Total: ₱${order.total}\n` +
            `Payment: ${order.paymentMethod}`
        );
        // Clear the cart and its localStorage data
        // after a successful order.
        cart.clear();
        checkoutForm.reset();
        document.getElementById(
            "checkoutModal"
        ).classList.add("hidden");
        renderCart();
    }
);
// START APPLICATION
loadProducts();
