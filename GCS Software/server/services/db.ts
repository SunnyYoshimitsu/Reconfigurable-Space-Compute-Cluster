import Cubesat from "../models/cubesat";

export async function createCubesat(drone_id: number, name: string) {
    try {
        await Cubesat.create({
            drone_id: drone_id,
            name: name
        });

        return {status: 'success', message: 'Cubesat created successfully'};
    } catch(error) {
        return {status: 'failure', message: `Cubesat creation unsuccessfull: ${error}`};
    }
}

export async function getAllCubesats() {
    try {
        const result = await Cubesat.findAll();

        return {status: 'success', message: 'All Cubesats returned successfully', data: result};
    } catch(error) {
        return {status: 'failure', message: `Cubesats not returned successfull: ${error}`};
    }
}

export async function updateCubesat(drone_id: number, fields: object) {
    try {
      // Perform the update with dynamic fields
      const result = await Cubesat.update(fields, {
        where: {
            drone_id: drone_id,
        },
      });

        return {status: 'success', message: 'Cubesat updated successfully'};
    } catch(error) {
        return {status: 'failure', message: `Cubesat updated unsuccessfull: ${error}`};
    }
}

export async function deleteCubesat(drone_id: number) {
    try {
        await Cubesat.destroy({
            where: {drone_id: drone_id}
        });

        return {status: 'success', message: 'Cubesat destroyed successfully'};
    } catch(error) {
        return {status: 'failure', message: `Cubesat destroyed unsuccessfull: ${error}`};
    }
}
