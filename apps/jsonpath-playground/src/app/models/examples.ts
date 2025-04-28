/**
 * Example data.
 */
export interface Example {
    /**
     * Display name of the example.
     */
    readonly name: string;

    /**
     * JSON data in a text form.
     */
    readonly jsonText: string;

    /**
     * JSON Schema for the JSON data in a text form.
     */
    readonly jsonSchemaText: string;

    /**
     * JSON Type Definition for the JSON data in a text form.
     */
    readonly jsonTypeDefinitionText: string;
}

/**
 * Application example data.
 */
export const examples: readonly Example[] = [
    {
        name: "Car Dealership",
        jsonText: `{
    "dealership": {
        "name": "Superior Auto Sales",
        "location": {
            "city": "Los Angeles",
            "state": "CA",
            "zip": "90001",
            "coordinates": [125.68, 32.24]
        },
        "inventory": [
            {
                "id": 1,
                "make": "Toyota",
                "model": "Camry",
                "year": 2022,
                "price": 27000,
                "features": ["Bluetooth", "Backup Camera", "Cruise Control"],
                "status": "available"
            },
            {
                "id": 2,
                "make": "Honda",
                "model": "Civic",
                "year": 2021,
                "price": 23000,
                "features": ["Sunroof", "Navigation", "Bluetooth"],
                "status": "sold"
            },
            {
                "id": 3,
                "make": "Ford",
                "model": "Mustang",
                "year": 2023,
                "price": 55000,
                "features": ["Leather Seats", "V8 Engine", "Navigation"],
                "status": "available"
            },
            {
                "id": 4,
                "make": "Tesla",
                "model": "Model 3",
                "year": 2022,
                "price": 48000,
                "features": ["Autopilot", "Electric", "Touchscreen Display"],
                "status": "available"
            },
            {
                "id": 5,
                "make": "Chevrolet",
                "model": "Silverado",
                "year": 2020,
                "price": 35000,
                "features": ["4WD", "Towing Package", "Backup Camera"],
                "status": "sold"
            }
        ],
        "employees": [
            {
                "id": 1,
                "name": "John Doe",
                "role": "Sales Manager",
                "experience": 10
            },
            {
                "id": 2,
                "name": "Jane Smith",
                "role": "Finance Specialist",
                "experience": 8
            },
            {
                "id": 3,
                "name": "Mike Johnson",
                "role": "Sales Associate",
                "experience": 5
            }
        ]
    }
}
`,
        jsonSchemaText: `{
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$defs": {
        "gcsCoordinates": {
            "title": "GCS Coordinates",
            "description": "Geographic Coordinate System coordinates (latitude and longtitude)",
            "type": "array",
            "prefixItems": [
                {
                    "title": "Latitude",
                    "description": "Latitude of the GCS coordinates",
                    "type": "number"
                },
                {
                    "title": "Longtitude",
                    "description": "Longtitude of the GCS coordinates",
                    "type": "number"
                }
            ],
            "items": false,
            "minItems": 2
        }
    },
    "title": "Car Dealership Data",
    "description": "Data representing a car dealership's inventory, employees, and location details.",
    "type": "object",
    "properties": {
        "dealership": {
            "title": "Dealership",
            "description": "Details of the car dealership",
            "type": "object",
            "properties": {
                "name": {
                    "title": "Dealership Name",
                    "description": "The official name of the dealership",
                    "type": "string"
                },
                "location": {
                    "title": "Location",
                    "description": "Physical location of the dealership",
                    "type": "object",
                    "properties": {
                        "city": {
                            "title": "City",
                            "description": "City where the dealership is located",
                            "type": "string"
                        },
                        "state": {
                            "title": "State",
                            "description": "State abbreviation (e.g., CA, NY)",
                            "type": "string",
                            "minLength": 2,
                            "maxLength": 2
                        },
                        "zip": {
                            "title": "ZIP Code",
                            "description": "5-digit postal ZIP code",
                            "type": "string",
                            "pattern": "^[0-9]{5}$"
                        },
                        "coordinates": {
                            "$ref": "#/$defs/gcsCoordinates"
                        }
                    },
                    "required": ["city", "state", "zip", "coordinates"],
                    "additionalProperties": false
                },
                "inventory": {
                    "title": "Inventory",
                    "description": "List of cars available at the dealership",
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {
                                "title": "Car ID",
                                "description": "Unique identifier for the car",
                                "type": "integer"
                            },
                            "make": {
                                "title": "Make",
                                "description": "Brand of the car (e.g., Toyota, Ford)",
                                "type": "string"
                            },
                            "model": {
                                "title": "Model",
                                "description": "Model name of the car",
                                "type": "string"
                            },
                            "year": {
                                "title": "Year",
                                "description": "Manufacturing year of the car",
                                "type": "integer",
                                "minimum": 1900,
                                "maximum": 2100
                            },
                            "price": {
                                "title": "Price",
                                "description": "Price of the car in USD",
                                "type": "number",
                                "minimum": 0
                            },
                            "features": {
                                "title": "Features",
                                "description": "List of car features",
                                "type": "array",
                                "items": {
                                    "type": "string"
                                }
                            },
                            "status": {
                                "title": "Status",
                                "description": "Availability status of the car",
                                "type": "string",
                                "enum": [
                                    "available",
                                    "sold"
                                ]
                            }
                        },
                        "required": ["id", "make", "model", "year", "price", "status"],
                        "additionalProperties": false
                    }
                },
                "employees": {
                    "title": "Employees",
                    "description": "List of dealership employees",
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {
                                "title": "Employee ID",
                                "description": "Unique identifier for the employee",
                                "type": "integer"
                            },
                            "name": {
                                "title": "Name",
                                "description": "Full name of the employee",
                                "type": "string"
                            },
                            "role": {
                                "title": "Role",
                                "description": "Job role of the employee",
                                "type": "string"
                            },
                            "experience": {
                                "title": "Experience",
                                "description": "Years of experience in the industry",
                                "type": "integer",
                                "minimum": 0
                            }
                        },
                        "required": ["id", "name", "role", "experience"],
                        "additionalProperties": false
                    }
                }
            },
            "required": ["name", "location", "inventory", "employees"],
            "additionalProperties": false
        }
    },
    "required": ["dealership"],
    "additionalProperties": false
}
`,
        jsonTypeDefinitionText: `{
    "definitions": {
        "gcsCoordinates": {
            "metadata": "Geographic Coordinate System coordinates (latitude and longtitude)",
            "elements": {
                "metadata": "Latitude/Longtitude of the GCS coordinates",
                "type": "float64"
            }
        }
    },
    "metadata": "Data representing a car dealership's inventory, employees, and location details.",
    "properties": {
        "dealership": {
            "metadata": "Details of the car dealership",
            "properties": {
                "name": {
                    "metadata": "The official name of the dealership",
                    "type": "string"
                },
                "location": {
                    "metadata": "Physical location of the dealership",
                    "properties": {
                        "city": {
                            "metadata": "City where the dealership is located",
                            "type": "string"
                        },
                        "state": {
                            "metadata": "State abbreviation (e.g., CA, NY)",
                            "type": "string"
                        },
                        "zip": {
                            "metadata": "5-digit postal ZIP code",
                            "type": "string"
                        },
                        "coordinates": {
                            "ref": "gcsCoordinates"
                        }
                    }
                },
                "inventory": {
                    "metadata": "List of cars available at the dealership",
                    "elements": {
                        "properties": {
                            "id": {
                                "metadata": "Unique identifier for the car",
                                "type": "int32"
                            },
                            "make": {
                                "metadata": "Brand of the car (e.g., Toyota, Ford)",
                                "type": "string"
                            },
                            "model": {
                                "metadata": "Model name of the car",
                                "type": "string"
                            },
                            "year": {
                                "metadata": "Manufacturing year of the car",
                                "type": "int32"
                            },
                            "price": {
                                "metadata": "Price of the car in USD",
                                "type": "float64"
                            },
                            "features": {
                                "metadata": "List of car features",
                                "elements": {
                                    "type": "string"
                                }
                            },
                            "status": {
                                "metadata": "Availability status of the car",
                                "enum": [
                                    "available",
                                    "sold"
                                ]
                            }
                        }
                    }
                },
                "employees": {
                    "metadata": "List of dealership employees",
                    "elements": {
                        "properties": {
                            "id": {
                                "metadata": "Unique identifier for the employee",
                                "type": "int32"
                            },
                            "name": {
                                "metadata": "Full name of the employee",
                                "type": "string"
                            },
                            "role": {
                                "metadata": "Job role of the employee",
                                "type": "string"
                            },
                            "experience": {
                                "metadata": "Years of experience in the industry",
                                "type": "int32"
                            }
                        }
                    }
                }
            }
        }
    }
}
`
    },
    {
        name: "Geometric Shapes",
        jsonText: `[
    {
        "type": "square",
        "side_length": 4,
        "color": "red",
        "coordinates": { "x": 5, "y": 10 }
    },
    {
        "type": "square",
        "side_length": 6,
        "color": "blue",
        "coordinates": { "x": 12, "y": 18 }
    },
    {
        "type": "rectangle",
        "width": 4,
        "height": 8,
        "color": "green",
        "coordinates": { "x": 20, "y": 25 }
    },
    {
        "type": "rectangle",
        "width": 10,
        "height": 5,
        "color": "yellow",
        "coordinates": { "x": 15, "y": 40 }
    },
    {
        "type": "circle",
        "radius": 3,
        "color": "purple",
        "coordinates": { "x": 8, "y": 8 }
    },
    {
        "type": "circle",
        "radius": 7,
        "color": "orange",
        "coordinates": { "x": 50, "y": 50 }
    },
    {
        "type": "line",
        "color": "black",
        "coordinates": { "x": 1, "y": 1 },
        "end_coordinates": { "x": 11, "y": 1 }
    },
    {
        "type": "line",
        "color": "red",
        "coordinates": { "x": 0, "y": 0 },
        "end_coordinates": { "x": 5, "y": 5 }
    },
    {
        "type": "square",
        "side_length": 2,
        "color": "green",
        "coordinates": { "x": 30, "y": 35 }
    },
    {
        "type": "rectangle",
        "width": 12,
        "height": 3,
        "color": "blue",
        "coordinates": { "x": 22, "y": 55 }
    },
    {
        "type": "circle",
        "radius": 4,
        "color": "cyan",
        "coordinates": { "x": 60, "y": 70 }
    },
    {
        "type": "line",
        "color": "yellow",
        "coordinates": { "x": 20, "y": 20 },
        "end_coordinates": { "x": 35, "y": 20 }
    },
    {
        "type": "square",
        "side_length": 3,
        "color": "purple",
        "coordinates": { "x": 10, "y": 30 }
    },
    {
        "type": "rectangle",
        "width": 9,
        "height": 6,
        "color": "orange",
        "coordinates": { "x": 40, "y": 15 }
    },
    {
        "type": "circle",
        "radius": 10,
        "color": "indigo",
        "coordinates": { "x": 70, "y": 90 }
    }
]`,
        jsonSchemaText: `{
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "Geometric Shapes Schema",
    "description": "A schema to validate different types of geometric shapes, including squares, rectangles, circles, and lines.",
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "type": {
                "type": "string",
                "enum": ["square", "rectangle", "circle", "line"],
                "description": "The type of geometric shape (square, rectangle, circle, or line)."
            },
            "color": {
                "type": "string",
                "description": "The color of the shape."
            },
            "coordinates": {
                "$ref": "#/$defs/coordinates",
                "description": "The starting coordinates (x, y) of the shape."
            }
        },
        "oneOf": [
            {
                "properties": {
                    "type": { "const": "square" },
                    "side_length": {
                        "type": "number",
                        "description": "The side length of the square."
                    }
                },
                "required": ["side_length"],
                "description": "A square with a specified side length."
            },
            {
                "properties": {
                    "type": { "const": "rectangle" },
                    "width": {
                        "type": "number",
                        "description": "The width of the rectangle."
                    },
                    "height": {
                        "type": "number",
                        "description": "The height of the rectangle."
                    }
                },
                "required": ["width", "height"],
                "description": "A rectangle with a specified width and height."
            },
            {
                "properties": {
                    "type": { "const": "circle" },
                    "radius": {
                        "type": "number",
                        "description": "The radius of the circle."
                    }
                },
                "required": ["radius"],
                "description": "A circle with a specified radius."
            },
            {
                "properties": {
                    "type": { "const": "line" },
                    "end_coordinates": {
                        "$ref": "#/$defs/coordinates",
                        "description": "The ending coordinates (x, y) of the line."
                    }
                },
                "required": ["end_coordinates"],
                "description": "A line with a start and end coordinate."
            }
        ],
        "required": ["type", "color", "coordinates"]
    },
    "$defs": {
        "coordinates": {
            "type": "object",
            "title": "Coordinates",
            "description": "An object representing the coordinates (x, y) of a point.",
            "properties": {
                "x": {
                    "type": "number",
                    "description": "The x-coordinate of the point."
                },
                "y": {
                    "type": "number",
                    "description": "The y-coordinate of the point."
                }
            },
            "required": ["x", "y"],
            "additionalProperties": false
        }
    }
}
`,
        jsonTypeDefinitionText: `{
    "metadata": "A schema to validate different types of geometric shapes, including squares, rectangles, circles, and lines.",
    "elements": {
        "discriminator": "type",
        "mapping": {
            "square": {
                "properties": {
                    "color": {
                        "type": "string",
                        "metadata": "The color of the shape."
                    },
                    "coordinates": {
                        "ref": "coordinates",
                        "metadata": "The starting coordinates (x, y) of the shape."
                    },
                    "side_length": {
                        "type": "float64",
                        "metadata": "The side length of the square."
                    }
                }
            },
            "rectangle": {
                "properties": {
                    "color": {
                        "type": "string",
                        "metadata": "The color of the shape."
                    },
                    "coordinates": {
                        "ref": "coordinates",
                        "metadata": "The starting coordinates (x, y) of the shape."
                    },
                    "width": {
                        "type": "float64",
                        "metadata": "The width of the rectangle."
                    },
                    "height": {
                        "type": "float64",
                        "metadata": "The height of the rectangle."
                    }
                }
            },
            "circle": {
                "properties": {
                    "color": {
                        "type": "string",
                        "metadata": "The color of the shape."
                    },
                    "coordinates": {
                        "ref": "coordinates",
                        "metadata": "The starting coordinates (x, y) of the shape."
                    },
                    "radius": {
                        "type": "float64",
                        "metadata": "The radius of the circle."
                    }
                }
            },
            "line": {
                "properties": {
                    "color": {
                        "type": "string",
                        "metadata": "The color of the shape."
                    },
                    "coordinates": {
                        "ref": "coordinates",
                        "metadata": "The starting coordinates (x, y) of the shape."
                    },
                    "end_coordinates": {
                        "ref": "coordinates",
                        "metadata": "The ending coordinates (x, y) of the line."
                    }
                }
            }
        }
    },
    "definitions": {
        "coordinates": {
            "metadata": "An object representing the coordinates (x, y) of a point.",
            "properties": {
                "x": {
                    "type": "float64",
                    "description": "The x-coordinate of the point."
                },
                "y": {
                    "type": "float64",
                    "description": "The y-coordinate of the point."
                }
            }
        }
    }
}`
    },
    {
        name: "Gym Workout",
        jsonText: `{
    "workout_id": 3,
    "date_time": "2025-04-28T15:30:09.61Z",
    "duration_minutes": 60,
    "is_indoor": true,
    "exercises": [
        {
            "name": "Push-Up",
            "sets": 4,
            "reps_per_set": 15,
            "rest_time_seconds": 60,
            "muscle_groups": ["Chest", "Triceps", "Shoulders"]
        },
        {
            "name": "Squat",
            "sets": 4,
            "reps_per_set": 20,
            "rest_time_seconds": 90,
            "muscle_groups": ["Quads", "Glutes", "Hamstrings"]
        },
        {
            "name": "Deadlift",
            "sets": 3,
            "reps_per_set": 10,
            "rest_time_seconds": 120,
            "muscle_groups": ["Lower Back", "Glutes", "Hamstrings"]
        },
        {
            "name": "Plank",
            "sets": 3,
            "duration_seconds": 45,
            "rest_time_seconds": 60,
            "muscle_groups": ["Core"]
        },
        {
            "name": "Bicep Curl",
            "sets": 3,
            "reps_per_set": 12,
            "rest_time_seconds": 60,
            "muscle_groups": ["Biceps"]
        }
    ],
    "notes": "Focused on full-body strength training with minimal cardio."
}
`,
        jsonSchemaText: `{
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "Workout Log",
    "description": "Schema for logging workout sessions with exercises and muscle groups.",
    "type": "object",
    "properties": {
        "workout_id": {
            "type": "integer",
            "title": "ID",
            "description": "Unique workout identifier."
        },
        "date_time": {
            "type": "string",
            "format": "date-time",
            "title": "Date",
            "description": "Workout date (YYYY-MM-DD)."
        },
        "duration_minutes": {
            "type": "number",
            "title": "Duration",
            "description": "Total workout duration in minutes."
        },
        "is_indoor": {
            "type": "boolean",
            "title": "Is Indoor",
            "description": "Whether it is inside."
        },
        "exercises": {
            "type": "array",
            "title": "Exercises",
            "description": "List of exercises performed.",
            "items": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "title": "Name",
                        "description": "Exercise name."
                    },
                    "sets": {
                        "type": "integer",
                        "title": "Sets",
                        "description": "Number of sets."
                    },
                    "reps_per_set": {
                        "type": "integer",
                        "title": "Reps per Set",
                        "description": "Reps per set."
                    },
                    "rest_time_seconds": {
                        "type": "number",
                        "title": "Rest Time",
                        "description": "Rest time between sets (seconds)."
                    },
                    "muscle_groups": {
                        "type": "array",
                        "title": "Muscle Groups",
                        "description": "Targeted muscle groups.",
                        "items": {
                            "type": "string",
                            "enum": [
                                "Chest", "Triceps", "Shoulders", "Quads", "Glutes", "Hamstrings", 
                                "Lower Back", "Core", "Biceps"
                            ]
                        }
                    },
                    "duration_seconds": {
                        "type": "number",
                        "title": "Duration",
                        "description": "Exercise duration (seconds, e.g., Plank)."
                    }
                },
                "required": ["name", "sets", "rest_time_seconds", "muscle_groups"],
                "additionalProperties": false
            }
        },
        "notes": {
            "type": "string",
            "title": "Notes",
            "description": "Additional workout comments."
        }
    },
    "required": ["workout_id", "date_time", "duration_minutes", "is_indoor", "exercises"],
    "additionalProperties": false
}`,
        jsonTypeDefinitionText: `{
    "metadata": "Schema for logging workout sessions with exercises and muscle groups.",
    "properties": {
        "workout_id": {
            "type": "uint32",
            "metadata": "Unique workout identifier."
        },
        "date_time": {
            "type": "timestamp",
            "metadata": "Workout date (YYYY-MM-DDThh:mm:ss.s)."
        },
        "duration_minutes": {
            "type": "float64",
            "metadata": "Total workout duration in minutes."
        },
        "is_indoor": {
            "type": "boolean",
            "metadata": "Whether it is inside."
        },
        "exercises": {
            "metadata": "List of exercises performed.",
            "elements": {
                "properties": {
                    "name": {
                        "type": "string",
                        "metadata": "Exercise name."
                    },
                    "sets": {
                        "type": "uint32",
                        "metadata": "Number of sets."
                    },
                    "rest_time_seconds": {
                        "type": "float64",
                        "metadata": "Rest time between sets (seconds)."
                    },
                    "muscle_groups": {
                        "metadata": "Targeted muscle groups.",
                        "elements": {
                            "enum": [
                                "Chest", "Triceps", "Shoulders", "Quads", "Glutes", "Hamstrings", 
                                "Lower Back", "Core", "Biceps"
                            ]
                        }
                    }
                },
                "optionalProperties": {
                    "reps_per_set": {
                        "type": "uint32",
                        "metadata": "Reps per set."
                    },
                    "duration_seconds": {
                        "type": "float64",
                        "metadata": "Exercise duration (seconds, e.g., Plank)."
                    }
                }
            }
        },
        "notes": {
            "type": "string",
            "metadata": "Additional workout comments."
        }
    }
}`
    }
];