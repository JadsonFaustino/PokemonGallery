const searchName = document.getElementById("search");
const selectType = document.getElementById("type");

const resetFilter = () => {
    searchName.value = "";
    selectType.selectedIndex = "0";
}

const pokemonPerPage = 151;
const loader = document.querySelector(".loading");
const pagesBox = document.querySelector("#pages-box");
const pokeRequest = (urlPokeRequest) => {
    fetch(urlPokeRequest)
        .then(response => response.json())
        .then(data => {
            const pokemonList = data.results;

            pagesBox.innerHTML = "";
            const totalPokemons = data.count;
            const totalPages = Math.ceil(totalPokemons / pokemonPerPage);
            const LastPokemonIdPrevPage = Number(urlPokeRequest.split("offset=")[1].split("&limit=")[0]);
            const thisPage = Math.floor(LastPokemonIdPrevPage / pokemonPerPage) + 1 ;
            
            for (let i = 1; i <= totalPages; i++) {
                const pageButton = document.createElement("button");
                pageButton.textContent = i;
                if (i == thisPage) {
                    pageButton.classList.add("active");
                }
                pageButton.addEventListener("click", function () {
                    pokeRequest(`https://pokeapi.co/api/v2/pokemon?offset=${(i-1) * pokemonPerPage}&limit=` + pokemonPerPage);
                });
                pagesBox.appendChild(pageButton);
            }

            setNextPage(data.next);
            setPrevPage(data.previous);

            const galleryDiv = document.querySelector(".gallery");
            loader.classList.remove("hidden");

            galleryDiv.innerHTML = `<div id="empty" class="empty hidden">
                                        <h2>No Pokémon found</h2>
                                       </div>`;
            
            let pokemonIdLabel = LastPokemonIdPrevPage; 
            // ^^ this is for the pokemon id label, for some reason API has a long gap in the id numbers
            // so we need to keep track of the last pokemon id from the previous page
            // and use it to label the pokemon on the current page

            pokemonList.forEach((pokemon) => {
                pokemonIdLabel++;
                const pokemonUrl = pokemon.url.split("/");
                const pokemonId = pokemonUrl[pokemonUrl.length - 2];
                
                const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
                const infoUrl = `https://pokeapi.co/api/v2/pokemon/${pokemonId}`;
                const evolutionUrl = `https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`;
                let evolutions = "";
                fetch(evolutionUrl)
                    .then(response => response.json())
                    .then(data => {
                        const evolutionChainUrl = data.evolution_chain.url;
                        fetch(evolutionChainUrl)
                            .then(response => response.json())
                            .then(data => {
                                evolutions = getEvolutionChain(data.chain);
                            })
                            .catch(error => console.log(error));
                    })
                    .catch(error => console.log(error));

                const imgElement = document.createElement("img");
                imgElement.src = imageUrl;

                const indexElement = document.createElement("span");
                indexElement.textContent = ("0000" + pokemonIdLabel).slice(-4);

                const nameElement = document.createElement("p");
                nameElement.textContent = capitalize(pokemon.name);

                const labelElement = document.createElement("div");
                labelElement.classList.add("label");
                labelElement.appendChild(indexElement);
                labelElement.appendChild(nameElement);

                const pokemonDiv = document.createElement("div");
                pokemonDiv.classList.add("pokemon");
                pokemonDiv.setAttribute("name",pokemon.name);
                pokemonDiv.id = "pokemon" + pokemonId;

                // add pokemon type as a data attribute
                fetch(infoUrl)
                    .then(response => response.json())
                    .then(data => {
                        const pokemonType = data.types.map(type => type.type.name || "none");
                        pokemonDiv.dataset.type = pokemonType.join(" ");
                    })
                    .catch(error => console.log(error));

                pokemonDiv.addEventListener("click", function () {
                    fetch(infoUrl)
                        .then(response => response.json())
                        .then(data => {
                            const pokemonInfo = {
                                id: pokemonId,
                                name: data.name,
                                type: data.types.map(type => type.type.name),
                                height: data.height,
                                weight: data.weight,
                                image: data.sprites.front_default,
                                evolutions: evolutions 
                            };
                            showModal(pokemonInfo, pokemonIdLabel);
                        })
                        .catch(error => console.log(error));
                });

                pokemonDiv.appendChild(imgElement);
                pokemonDiv.appendChild(labelElement);

                galleryDiv.appendChild(pokemonDiv);
            });
        })
        .then(() => {
            loader.classList.add("hidden");
            const filterBox = document.querySelector("#filter-box");
            filterBox.style.display = "flex";
            resetFilter();
        })
        .catch(error => console.log(error));
}

const nextButton = document.getElementById("next");
const setNextPage = (nextPageUrl) => {
    if (nextPageUrl) {
        nextPageUrl = nextPageUrl.split("&limit=")[0] + "&limit=" + pokemonPerPage;
        nextButton.classList.remove("hidden");
        nextButton.dataset.url = nextPageUrl;
    } else {
        nextButton.classList.add("hidden");
    }
};
nextButton.addEventListener("click", function () {
    const url = this.dataset.url;
    pokeRequest(url);
});

const prevButton = document.getElementById("prev");
const setPrevPage = (prevPageUrl) => {
    if (prevPageUrl) {
        prevPageUrl = prevPageUrl.split("&limit=")[0] + "&limit=" + pokemonPerPage;
        prevButton.classList.remove("hidden");
        prevButton.dataset.url = prevPageUrl;
    } else {
        prevButton.classList.add("hidden");
    }
};
prevButton.addEventListener("click", function () {
    const url = this.dataset.url;
    pokeRequest(url);
});


function searchPokemon() {    
    const filterName = search.value.toUpperCase();
    const filterType = selectType.value.toUpperCase();
    const gallery = document.querySelector(".gallery");
    const pokemon = gallery.getElementsByClassName("pokemon");
    let count = 0;
    for (let i = 0; i < pokemon.length; i++) {
        const name = pokemon[i].getAttribute("name");
        const type = pokemon[i].dataset.type;
        
        const matchName = name.toUpperCase().indexOf(filterName) > -1;
        const matchType = type.toUpperCase().indexOf(filterType) > -1 || filterType === "ALL";
        if (matchName && matchType) {
            document.getElementById("empty").classList.add("hidden");
            pokemon[i].style.display = "";
        } else {
            pokemon[i].style.display = "none";
            count++;
        }
    }
    if (count === pokemon.length) {
        document.getElementById("empty").classList.remove("hidden");
    }
}

searchName.addEventListener("keyup", searchPokemon);
selectType.addEventListener("change", searchPokemon);

function getEvolutionChain(evolutionChain) {
    const evolutions = [];
    evolutions.push(evolutionChain.species.name);
    if (evolutionChain.evolves_to.length > 0) {
        evolutionChain.evolves_to.forEach(evolution => {
            evolutions.push(evolution.species.name);
            if (evolution.evolves_to.length > 0) {
                evolution.evolves_to.forEach(evolution => {
                    evolutions.push(evolution.species.name);
                });
            }
        });
    }
    return capitalizePhrase(evolutions.join(", "));    
}

function capitalizePhrase(string) {
    const words = string.split(" ");
    const capitalizedWords = words.map(word => capitalize(word));
    return capitalizedWords.join(" ");
}


function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function playPokemonSound(soundUrl) {
    const audio = new Audio(soundUrl);
    audio.play();
}

function showModal(pokemon, pokemonId) {
    const modal = document.getElementById("modal");
    const modalTitle = document.getElementById("modal-title");
    const modalType = document.getElementById("modal-type");
    const modalHeight = document.getElementById("modal-height");
    const modalWeight = document.getElementById("modal-weight");
    const modalEvolutions = document.getElementById("modal-evolutions");
    const modalImage = document.getElementById("modal-image");

    modalType.innerHTML = '';

    // for each pokemon type, add a class to the modal
    for (let i = 0; i < pokemon.type.length; i++) {
        let typeName = String(pokemon.type[i]);
        let typeElement = document.createElement("span");
        typeElement.className = "type " + typeName;
        typeElement.textContent = typeName.toUpperCase();
        modalType.appendChild(typeElement);
    }
    
    // modalTitle.textContent = "#" + pokemon.id + " " + capitalize(pokemon.name);
    modalTitle.textContent = "#" + pokemonId + " " + capitalize(pokemon.name);
    
    modalHeight.textContent = pokemon.height/10 + " m";
    modalWeight.textContent = pokemon.weight/10 + " kg";
    modalEvolutions.textContent = pokemon.evolutions;
    modalImage.src = pokemon.image;

    modal.style.display = "flex";
}

window.addEventListener("load", function () {
    pokeRequest("https://pokeapi.co/api/v2/pokemon?offset=0&limit=" + pokemonPerPage);
});

document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("modal");
    const closeModal = document.querySelector(".close");

    closeModal.addEventListener("click", function () {
        modal.style.display = "none";
    });

    window.addEventListener("click", function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
});