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
        name: "Some Example 2",
        jsonText: `"TODO: JSON"`,
        jsonSchemaText: `"TODO: JSON Schema"`,
        jsonTypeDefinitionText: `"TODO: JSON Type Definition"`
    },
    {
        name: "Some Example 3",
        jsonText: `"TODO: JSON"`,
        jsonSchemaText: `"TODO: JSON Schema"`,
        jsonTypeDefinitionText: `"TODO: JSON Type Definition"`
    }
];