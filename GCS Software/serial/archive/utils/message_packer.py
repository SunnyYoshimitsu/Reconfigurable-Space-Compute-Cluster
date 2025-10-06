import struct

def unpack_telemetry(packet):
    # Unpack the first 44 bytes where our data is located.
    # The structure is:
    #   uint32_t x (4 bytes)
    #   uint32_t y (4 bytes)
    #   uint32_t z (4 bytes)
    #   float sun_location[4] (16 bytes)
    #   uint32_t temp (4 bytes)
    #   uint32_t voltage (4 bytes)
    #   uint32_t current (4 bytes)
    #   uint32_t battery_level (4 bytes)
    fmt = '<III4fIIII'
    unpacked = struct.unpack(fmt, packet[:44])
    x, y, z, sun1, sun2, sun3, sun4, temp, voltage, current, battery_level = unpacked

    # Print the received values.
    print("Received data:")
    print(f"  x: {x}")
    print(f"  y: {y}")
    print(f"  z: {z}")
    print(f"  sun_location: [{sun1}, {sun2}, {sun3}, {sun4}]")
    print(f"  temp: {temp}")
    print(f"  voltage: {voltage}")
    print(f"  current: {current}")
    print(f"  battery_level: {battery_level}")
    
    return {
        'status': 'success',
        'data': {
            'x': x,
            'y': y,
            'z': z,
            'sun_location': [sun1, sun2, sun3, sun4],
            'temp': temp,
            'voltage': voltage,
            'current': current,
            'battery_level': battery_level
        }
    }

def unpack_ping(packet):
    # from packet, returns telemetry = { 'status': 'success', 'type': 'update', 'params': { 'id': 0, 'active': True } } data type
    
    return ''

def pack_message(packet):

    return ''