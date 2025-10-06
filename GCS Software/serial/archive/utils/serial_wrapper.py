import time

PACKET_SIZE = 256
ACK_BYTE = b"\x06"

def write_to_serial_from_bin(port):
    BIN_FILE = "jtagtimeouttest.bin"

    with open(BIN_FILE, "rb") as f:
        file_data = f.read()

    num_packets = len(file_data)

    time.sleep(0.5)

    start_time = time.time()

    for i in range(num_packets):
        chunk = file_data[i * PACKET_SIZE:(i + 1) * PACKET_SIZE]
        port.write(chunk.encode())

        retries = 0
        while retries < 10:
            ack = port.read(1)
            if ack == ACK_BYTE:
                print(f"ACK received for packet {i+1}")
                break
            else:
                retries += 1
                print(f"No ACK for packet {i+1}, retrying {retries}/10...")
                time.sleep(0.05)
                port.write(chunk)

        if retries == 10:
            print(f"ERROR: Packet {i+1} failed after 10 retries. Stopping transfer.")
            break

    end_time = time.time()
    print(f"\nTransfer complete in {end_time - start_time:.2f} seconds")

def read_from_serial_to_bin(port):
    BIN_FILE = "received_file.bin"

    with open(BIN_FILE, "wb") as f:
        received_packets = 0
        start_time = time.time()

        while True:
            chunk = port.read(PACKET_SIZE)
            if not chunk: break

            f.write(chunk)
            received_packets += 1
            print(f"Received packet {received_packets}")

        end_time = time.time()

    port.write(ACK_BYTE)
    print(f"\nAll packets received. ACK sent.")
    print(f"Transfer complete in {end_time - start_time:.2f} seconds.")
