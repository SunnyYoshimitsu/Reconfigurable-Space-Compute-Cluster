import serial
import serial.tools.list_ports

def list_connected_ports():
    # Get a list of all available serial ports
    ports = serial.tools.list_ports.comports()

    connected_ports = []
    
    for port in ports:
        try:
            connected_ports.append(port.device)
        except serial.SerialException as e:
            print("Error opening port")
            continue
    
    return connected_ports

connected_ports = list_connected_ports()
print(connected_ports)
