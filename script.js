async function searchPokemon() {
    const input = document.getElementById('searchInput').value;
    if (!input) {
        alert('Please enter a Pokemon name or index number.');
        return;
    }

    try {
        const response = await fetch(`/pokemon?identifier=${input}`);
        if (!response.ok) {
            throw new Error('Failed to fetch Pokemon data. Please try again.');
        }
        const data = await response.json();
        displayPokemon(data);
    } catch (error) {
        console.error('Error:', error.message);
        alert(error.message);
    }
}

// Add an event listener to the search button
document.getElementById('searchButton').addEventListener('click', () => {
    const searchInput = document.getElementById('searchInput').value;

    // Make sure the search input is not empty
    if (searchInput.trim() !== '') {
        // Fetch Pokémon data from Flask route
        fetch(`/pokemon?identifier=${searchInput}`)
            .then(response => response.json())
            .then(data => {
                // Extract the evolution_chain_id from the JSON response
                const evolutionChainId = data.evolution_chain_id;

                // Store the evolution_chain_id in a hidden element in the HTML
                const evolutionChainIdDiv = document.getElementById('evolutionChainId');
                evolutionChainIdDiv.textContent = evolutionChainId;
            })
            .catch(error => {
                console.error('Error fetching Pokemon data:', error);
            });
    } else {
        console.error('Please provide a Pokemon name or index number.');
    }
});


function navigateEvolution(direction) {
    // Fetch the Pokemon ID of the current Pokemon
    const pokemonInfoDiv = document.getElementById('pokemonInfo');
    const idParagraph = pokemonInfoDiv.querySelector('p'); // Select the <p> element
    const idText = idParagraph.textContent; // Get the text content of the <p> element
    const currentPokemonId = parseInt(idText.split(' ')[1]); // Extract and parse the numeric part

    // Fetch the evolution chain ID
    const evolutionChainIdDiv = document.getElementById('evolutionChainId');
    const chainId = parseInt(evolutionChainIdDiv.textContent);

    // Fetch the evolution chain data
    fetch(`https://pokeapi.co/api/v2/evolution-chain/${chainId}`)
        .then(response => response.json())
        .then(data => {
            // Find the ID of the next/previous evolution
            const nextPokemonId = getNextPokemonId(data, currentPokemonId, direction);
            // Fetch data for the next/previous evolution
            fetch(`/pokemon?identifier=${nextPokemonId}`)
                .then(response => response.json())
                .then(pokemonData => {
                    // Display the data for the next/previous evolution
                    displayPokemon(pokemonData);
                })
                .catch(error => {
                    console.error('Error fetching Pokemon data:', error);
                });
        })
        .catch(error => {
            console.error('Error fetching evolution chain data:', error);
        });
}

function getNextPokemonId(evolutionChainData, currentPokemonId, direction) {
    // Extract the evolution chain nodes
    const evolutionNodes = [evolutionChainData.chain.species, ...evolutionChainData.chain.evolves_to.map(node => node.species), ...evolutionChainData.chain.evolves_to.flatMap(node => node.evolves_to.map(childNode => childNode.species))];

    // Find the current Pokemon index within the evolution chain
    const currentPokemonIndex = evolutionNodes.findIndex(node => parseInt(node.url.split('/')[6]) === currentPokemonId);

    // Determine the index of the next/previous evolution
    let nextPokemonIndex;
    if (direction === 1) {
        // Move to the next evolution
        nextPokemonIndex = currentPokemonIndex + 1;
    } else if (direction === -1) {
        // Move to the previous evolution
        nextPokemonIndex = currentPokemonIndex - 1;
    }

    // Find the species URL of the next/previous evolution
    const nextPokemonSpecies = evolutionNodes[nextPokemonIndex];

    // Extract the Pokemon ID from the species URL
    const nextPokemonId = nextPokemonSpecies ? parseInt(nextPokemonSpecies.url.split('/')[6]) : null;

    return nextPokemonId;
}

function displayPokemon(pokemon) {
    const pokemonInfoDiv = document.getElementById('pokemonInfo');
    pokemonInfoDiv.innerHTML = '';

    if (!pokemon || pokemon.error) {
        // Display error message if pokemon data is invalid or contains an error
        const errorMessage = pokemon && pokemon.error ? pokemon.error : "Failed to fetch Pokemon data. Please try again.";
        pokemonInfoDiv.textContent = errorMessage;
        return;
    }

    const pokemonName = pokemon.name;
    const pokemonId = pokemon.id;
    const pokemonSpecies = pokemon.species;
    const pokemonTypes = pokemon.types.join(", ");
    const pokemonHeight = pokemon.height;
    const pokemonWeight = pokemon.weight;
    const pokemonDescription = pokemon.description;
    const pokemonImage = pokemon.image_url;

    const nameElement = document.createElement('h2');
    nameElement.textContent = `Name: ${pokemonName}`;
    pokemonInfoDiv.appendChild(nameElement);

    const idElement = document.createElement('p');
    idElement.textContent = `ID: ${pokemonId}`;
    pokemonInfoDiv.appendChild(idElement);

    const speciesElement = document.createElement('p');
    speciesElement.textContent = `Species: ${pokemonSpecies}`;
    pokemonInfoDiv.appendChild(speciesElement);

    const typesElement = document.createElement('p');
    typesElement.textContent = `Types: ${pokemonTypes}`;
    pokemonInfoDiv.appendChild(typesElement);

    const heightElement = document.createElement('p');
    heightElement.textContent = `Height: ${pokemonHeight} m`;
    pokemonInfoDiv.appendChild(heightElement);

    const weightElement = document.createElement('p');
    weightElement.textContent = `Weight: ${pokemonWeight} kg`;
    pokemonInfoDiv.appendChild(weightElement);

    const descriptionElement = document.createElement('p');
    descriptionElement.textContent = `Description: ${pokemonDescription}`;
    pokemonInfoDiv.appendChild(descriptionElement);

    if (pokemonImage) {
        const imageElement = document.createElement('img');
        imageElement.src = pokemonImage;
        pokemonInfoDiv.appendChild(imageElement);
        // Check if evolutionArrows div exists, if not, create it
        let arrowsDiv = document.getElementById('evolutionArrows');
        if (!arrowsDiv) {
            arrowsDiv = document.createElement('div');
            arrowsDiv.id = 'evolutionArrows';
            arrowsDiv.classList.add('evolution-arrows');
            pokemonInfoDiv.appendChild(arrowsDiv);
        } else {
            // Clear any existing arrows
            arrowsDiv.innerHTML = '';
        }

        // Show the arrows if the Pokemon has evolution
        if (pokemon.evolution_position !== undefined && pokemon.evolution_position !== 0) {
            arrowsDiv.style.display = 'block';
        } else {
            arrowsDiv.style.display = 'none';
        }

        // Display arrows based on evolution position
        if (pokemon.evolution_position === 1) {
            const rightArrow = document.createElement('span');
            rightArrow.classList.add('arrow');
            rightArrow.textContent = '→';
            rightArrow.onclick = function() { navigateEvolution(1); };
            arrowsDiv.appendChild(rightArrow);
        } else if (pokemon.evolution_position === 2) {
            const leftArrow = document.createElement('span');
            leftArrow.classList.add('arrow');
            leftArrow.textContent = '←';
            leftArrow.onclick = function() { navigateEvolution(-1); };
            arrowsDiv.appendChild(leftArrow);

            const rightArrow = document.createElement('span');
            rightArrow.classList.add('arrow');
            rightArrow.textContent = '→';
            rightArrow.onclick = function() { navigateEvolution(1); };
            arrowsDiv.appendChild(rightArrow);
        } else if (pokemon.evolution_position === 3) {
            const leftArrow = document.createElement('span');
            leftArrow.classList.add('arrow');
            leftArrow.textContent = '←';
            leftArrow.onclick = function() { navigateEvolution(-1); };
            arrowsDiv.appendChild(leftArrow);
        }
        // Add a div to display Pokémon stats
        const statsDiv = document.createElement('div');
        statsDiv.id = 'pokemonStats';
        statsDiv.classList.add('pokemon-stats');
        pokemonInfoDiv.appendChild(statsDiv);

        // Display Pokémon stats
        const stats = pokemon.stats;
        Object.keys(stats).forEach(statName => {
            const statContainer = document.createElement('div');
            statContainer.classList.add('stat-container');

            const statNameElement = document.createElement('span');
            statNameElement.textContent = statName.toUpperCase() + ': ';
            statContainer.appendChild(statNameElement);

            const statValueElement = document.createElement('span');
            statValueElement.textContent = stats[statName];
            statContainer.appendChild(statValueElement);

            // Create a progress bar for the stat value
            const progressBar = document.createElement('div');
            progressBar.classList.add('progress-bar');
            progressBar.style.width = `${stats[statName]}%`;
            statContainer.appendChild(progressBar);

            statsDiv.appendChild(statContainer);
        });

    } else {
        const errorElement = document.createElement('p');
        errorElement.textContent = "Image not available";
        pokemonInfoDiv.appendChild(errorElement);
    }

}

function findPokemonInChain(chain, index) {
    // Recursive function to traverse the evolution chain and find the Pokémon at the given index
    function traverseChain(node, currentIndex) {
        if (currentIndex === index) {
            return node.species;
        }
        if (node.evolves_to.length > 0) {
            for (const nextNode of node.evolves_to) {
                const result = traverseChain(nextNode, currentIndex + 1);
                if (result) {
                    return result;
                }
            }
        }
        return null; // Return null if Pokémon is not found at the specified index
    }

    // Start traversal from the root of the chain
    return traverseChain(chain, 0);
}
