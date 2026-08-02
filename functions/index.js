const { onRequest } = require("firebase-functions/v2/https");

exports.getPlants = onRequest(
    {
        cors: true
    },

    async (req, res) => {

        try {

            const response = await fetch(
                "https://www.plantsolve.com/api/v1/plants/index.json"
            );

            if (!response.ok) {

                throw new Error(
                    `PlantSolve returned ${response.status}`
                );

            }

            const data = await response.json();

            res.status(200).json(data);

        } catch (error) {

            console.error(
                "PlantSolve error:",
                error
            );

            res.status(500).json({
                error: "Failed to load PlantSolve data."
            });

        }

    }
);