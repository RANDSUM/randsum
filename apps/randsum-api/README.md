<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/main/icon.webp" alt="Randsum Logo. A Dotted D6 rolled a 6 with the dots arranged to look like an R.">
  <h1>RANDSUM API</h1>
  <h3>A high-performance RESTful API for dice rolling</h3>
</div>

A powerful, flexible API for rolling dice using the RANDSUM dice library. Perfect for integrating dice rolling functionality into web applications, games, virtual tabletops, and more.

## Features

- Roll dice using standard dice notation
- Configure rolls with query parameters
- Support for all RANDSUM modifiers (drop, reroll, cap, etc.)
- Built with Bun for high performance
- JSON responses with detailed roll results
- Simple, well-documented endpoints
- Cross-origin support for web applications
- Lightweight and fast

## Getting Started

### Development

```bash
# Start the development server with hot reloading
bun moon randsum-api:dev
```

### Production

```bash
# Build the API
bun moon randsum-api:build

# Start the production server
bun moon randsum-api:start
```

## API Endpoints

### `GET /roll`

Roll dice based on query parameters.

#### Parameters

- `notation`: Dice notation string (e.g., "2d20", "4d6L")
- `sides`: Number of sides on the die (default: 20)
- `quantity`: Number of dice to roll (default: 1)
- `plus`: Add a value to the roll total
- `minus`: Subtract a value from the roll total
- `drop_lowest`: Drop the lowest N dice
- `drop_highest`: Drop the highest N dice
- `drop_exact`: Drop dice with exact values (comma-separated)
- `drop_less_than`: Drop dice with values less than N
- `drop_greater_than`: Drop dice with values greater than N
- `reroll_less_than`: Reroll dice with values less than N
- `reroll_greater_than`: Reroll dice with values greater than N
- `reroll_exact`: Reroll dice with exact values (comma-separated)
- `reroll_max`: Maximum number of rerolls
- `cap_greater_than`: Cap dice values at a maximum
- `cap_less_than`: Cap dice values at a minimum
- `unique`: Ensure all dice have unique values (true/false)

#### Examples

```http
GET /roll?notation=2d20
GET /roll?sides=6&quantity=4&drop_lowest=1
GET /roll?sides=20&quantity=2&plus=5
```

#### Response

```json
{
  "result": {
    "total": 15,
    "rolls": [7, 8],
    "rawRolls": { "key": [7, 8] },
    "modifiedRolls": { "key": { "rolls": [7, 8], "total": 15 } },
    "rawResult": [7, 8],
    "result": [7, 8],
    "type": "numerical"
  },
  "params": {
    "notation": "2d20"
  },
  "notation": "2d20"
}
```

### `GET /health`

Health check endpoint.

#### Health Response

```json
{
  "status": "ok"
}
```

### `GET /`

API documentation endpoint. Returns a JSON object with information about all available endpoints, parameters, and examples.

## Made with

- [Bun](https://bun.sh) - JavaScript runtime & toolkit
- [RANDSUM](https://github.com/RANDSUM/randsum) - Dice rolling library
- [Moon](https://moonrepo.dev) - Build system
