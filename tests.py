import unittest
from PokedexApp.pokemon_app import app, get_pokemon_data


class TestApp(unittest.TestCase):

    def setUp(self):
        self.app = app.test_client()

    def test_get_pokemon_data_by_name(self):
        pokemon_data = get_pokemon_data("bulbasaur")
        self.assertIsNotNone(pokemon_data)
        self.assertEqual(pokemon_data["name"], "bulbasaur")

    def test_get_pokemon_data_by_index(self):
        pokemon_data = get_pokemon_data("1")
        self.assertIsNotNone(pokemon_data)
        self.assertEqual(pokemon_data["name"], "bulbasaur")


if __name__ == "__main__":
    unittest.main()
