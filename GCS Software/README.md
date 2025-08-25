# GCS Software

Ground Control Station Software to provide Drone Communication UI.\
\
Architecture:
![alt text](<GCS Software Diagram(5).jpg>)
\
The software architecture for our communications hub is designed to facilitate real-time communication, data monitoring, and efficient messaging between multiple CubeSats and the ground control station (GCS). The system leverages a streamlined pipeline that integrates various technologies to ensure reliable communication and user accessibility.\
\
The core software is built using React.js with TypeScript for the frontend, paired with Electron to create a desktop application that offers a user-friendly interface. Electron was chosen for its ability to develop cross-platform desktop applications using familiar web development frameworks, ensuring compatibility with tools commonly used in the industry.\
\
Data is transmitted between the frontend and backend via WebSockets, enabling fast, event-driven communication. The backend communicates with RabbitMQ over Advanced Message Queuing Protocol (AMQP) to manage message queues and ensure efficient data routing. A Python script further interfaces with the Raspberry Pi Pico via USB, which controls the LoRa module for sub-GHz communication with the CubeSat.\
\
For enhanced portability and simplified deployment, the entire system runs in a Docker container. This ensures consistent performance across different operating systems and simplifies dependency management. The result is a robust software solution that streamlines communication, enhances data visualization, and supports seamless multi-CubeSat monitoring for mission-critical operations.\

## Download Dependencies

### Docker

Docker Engine: https://docs.docker.com/engine/install/
Optional: https://docs.docker.com/desktop/

### Node.JS

Node.js: https://nodejs.org/en/download

### Download Python

Python: https://www.python.org/downloads/

## Running App

### Run Commands via CLI Menu

Run `node start.js` for all user options

### Run Backend with Docker

Open Docker Desktop to be able to run on Mac/Windows\
Run `docker-compose up --build` or `docker-compose up -d` to run in the background

### Run Local Electron App

Run `npm install` to install depencencies before running app (first time only / after new depencencies added)\
Run `npm start` to Start App

### Run Python Script

**Recommended**: Python Virtual Environment

Run `python -m venv venv`\
Activate using `venv\Scripts\activate` or `source venv/bin/activate`\
Install dependencies using `pip install -r requirements.txt`\
To manually deactivate vir. env. use `deactivate`

**Run Script**

Run `venv\Scripts\activate` if using venv\
Change directory - `cd serial`\
Run `python ./serial_message_router.py`

## Additional Info

Further Development for LoRa Communication for Raspberry Pico's.\
Check LoraRecv and LoraTran for progress.

Use `serial/utils/port_finder.py` to find port name for Raspi USB Connection (EX: COM3)

## Sources

Electron React Template - https://github.com/electron-react-boilerplate/electron-react-boilerplate

## Contact

bradjkim03@gmail.com\
Discord: Redemption#9228\
