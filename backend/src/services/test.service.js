const userRepository = require('../repositories/user.repository');

async function testRepository() {
    try{
        const user = await userRepository.findUserByEmail('abc@gmail.com');
        console.log('User found:', user);
    } catch (error) {
        console.error('Error occurred while testing repository:');
        console.error(error.message);
    }
}