from flask import Flask, jsonify, request, render_template
import requests

app = Flask(__name__)

POKEAPI_BASE_URL = "https://pokeapi.co/api/v2/"


def get_pokemon_data(identifier):
    url = f"{POKEAPI_BASE_URL}pokemon/{identifier}"
    response = requests.get(url)

    if response.status_code == 200:
        pokemon_data = response.json()
        name = pokemon_data["name"]
        image_url = f"https://img.pokemondb.net/artwork/{name}.jpg"
        # Check if the Pokemon has evolution
        evolution_chain_id = get_evolution_chain(pokemon_data["id"])
        if evolution_chain_id:
            evolution_position = get_evolution_position(evolution_chain_id, pokemon_data["id"])
        else:
            evolution_position = None
        refined_data = {
            "id": pokemon_data["id"],
            "name": name.capitalize(),
            "height": pokemon_data["height"] / 10,  # Convert height to meters
            "weight": pokemon_data["weight"] / 10,  # Convert weight to kilograms
            "species": pokemon_data["species"]["name"].capitalize(),
            "types": [t["type"]["name"] for t in pokemon_data["types"]],
            "description": "No description available",  # Default value in case description is not available
            "stats": {stat["stat"]["name"]: stat["base_stat"] for stat in pokemon_data["stats"]},
            "evolution_position": evolution_position,
            "evolution_chain_id": evolution_chain_id
        }

        # Fetch description from another API (e.g., PokeAPI) if available
        species_url = pokemon_data["species"]["url"]
        species_response = requests.get(species_url)
        if species_response.status_code == 200:
            species_data = species_response.json()
            for flavor_text in species_data["flavor_text_entries"]:
                if flavor_text["language"]["name"] == "en":
                    refined_data["description"] = flavor_text["flavor_text"]
                    break

        refined_data["image_url"] = image_url  # Add image URL
        return refined_data
    else:
        return None


def get_evolution_chain(identifier):
    url = f"{POKEAPI_BASE_URL}pokemon-species/{identifier}/"
    response = requests.get(url)
    if response.status_code == 200:
        species_data = response.json()
        evolution_chain_url = species_data.get("evolution_chain", {}).get("url")
        if evolution_chain_url:
            chain_id = evolution_chain_url.split("/")[-2]  # Extract chain ID from the URL
            return chain_id
    return None


def get_evolution_position(chain_id, pokemon_id):
    url = f"{POKEAPI_BASE_URL}evolution-chain/{chain_id}/"
    response = requests.get(url)
    if response.status_code == 200:
        evolution_chain_data = response.json()
        chain = evolution_chain_data.get("chain")
        if chain:
            # Traverse the evolution chain to find the position of the Pokemon
            evolution_position = find_evolution_position(chain, pokemon_id)
            return evolution_position
    return None


def find_evolution_position(chain, pokemon_id):
    # Recursive function to find the position of the Pokemon in the evolution chain
    if chain["species"]["url"].split("/")[-2] == str(pokemon_id):
        return 1
    for evolves_to in chain["evolves_to"]:
        result = find_evolution_position(evolves_to, pokemon_id)
        if result is not None:
            return result + 1
    return None


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/pokemon", methods=["GET"])
def get_pokemon():
    identifier = request.args.get("identifier")
    if not identifier:
        return jsonify({"error": "Please provide a Pokemon name or index number."}), 400

    pokemon_data = get_pokemon_data(identifier)
    if pokemon_data:
        evolution_chain_id = get_evolution_chain(identifier)
        pokemon_data['evolution_chain_id'] = evolution_chain_id
        return jsonify(pokemon_data)
    else:
        return jsonify({"error": "Pokemon not found."}), 404


if __name__ == "__main__":
    app.run(debug=True)
