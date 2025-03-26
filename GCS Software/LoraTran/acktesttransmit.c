#include <stdio.h>
#include <string.h>
#include "pico/stdlib.h"
#include "hardware/spi.h"
#include "hardware/gpio.h"

#define SPI_PORT spi1
#define PIN_SCK 10
#define PIN_MISO 12
#define PIN_MOSI 11
#define PIN_NSS 13
#define PIN_RST 15
#define PIN_DIO0 14

#define PACKETS_BEFORE_WAIT 5  // Send 5 packets before waiting for ACK
#define MAX_RETRIES 3          // Max retries per packet
#define ACK_TIMEOUT_MS 500     // Timeout to wait for ACK
#define PACKET_SIZE 128        // 128 bytes of actual data
#define LAST_PACKET_TAG 0xFFFF  // Special tag to mark the last packet

volatile int ack_received = 0;
volatile int sent_packet_count = 0;
char last_sent_messages[PACKETS_BEFORE_WAIT][PACKET_SIZE + 2]; // Store last sent packets
uint16_t current_packet_id = 0;

void spi_init_pico();
void sx1278_reset();
void sx1278_write_register(uint8_t reg, uint8_t value);
uint8_t sx1278_read_register(uint8_t reg);
void lora_init();
void lora_send(uint16_t packet_id, char *data);
void retry_last_packets();
void on_ack_received(uint gpio, uint32_t events);
void setup_lora_interrupt();

void spi_init_pico() {
    spi_init(SPI_PORT, 500 * 1000);
    gpio_set_function(PIN_SCK, GPIO_FUNC_SPI);
    gpio_set_function(PIN_MOSI, GPIO_FUNC_SPI);
    gpio_set_function(PIN_MISO, GPIO_FUNC_SPI);

    gpio_init(PIN_NSS);
    gpio_set_dir(PIN_NSS, GPIO_OUT);
    gpio_put(PIN_NSS, 1);

    gpio_init(PIN_RST);
    gpio_set_dir(PIN_RST, GPIO_OUT);
    gpio_put(PIN_RST, 1);
}

void sx1278_reset() {
    gpio_put(PIN_RST, 0);
    sleep_ms(10);
    gpio_put(PIN_RST, 1);
    sleep_ms(10);
}

void sx1278_write_register(uint8_t reg, uint8_t value) {
    uint8_t data[2] = {reg | 0x80, value};
    gpio_put(PIN_NSS, 0);
    spi_write_blocking(SPI_PORT, data, 2);
    gpio_put(PIN_NSS, 1);
}

uint8_t sx1278_read_register(uint8_t reg) {
    uint8_t value;
    gpio_put(PIN_NSS, 0);
    spi_write_blocking(SPI_PORT, &reg, 1);
    spi_read_blocking(SPI_PORT, 0, &value, 1);
    gpio_put(PIN_NSS, 1);
    return value;
}

void lora_init() {
    sx1278_reset();
    sx1278_write_register(0x01, 0x80); // Set LoRa mode
    sx1278_write_register(0x09, 0xFF); // Set max power
    sx1278_write_register(0x0E, 0x00); // Set FIFO TX base address
    sx1278_write_register(0x0F, 0x00); // Set FIFO RX base address
    sx1278_write_register(0x1D, 0x72); // Modem Config 1
    sx1278_write_register(0x1E, 0x74); // Modem Config 2
}

void setup_lora_interrupt() {
    gpio_init(PIN_DIO0);
    gpio_set_dir(PIN_DIO0, GPIO_IN);
    gpio_pull_down(PIN_DIO0);
    gpio_set_irq_enabled_with_callback(PIN_DIO0, GPIO_IRQ_EDGE_RISE, true, &on_ack_received);
}

void on_ack_received(uint gpio, uint32_t events) {
    if (gpio == PIN_DIO0) {
        uint8_t len = sx1278_read_register(0x13);
        sx1278_write_register(0x0D, sx1278_read_register(0x10));

        char ack_buffer[4] = {0};
        for (int i = 0; i < len && i < sizeof(ack_buffer) - 1; i++) {
            ack_buffer[i] = sx1278_read_register(0x00);
        }

        sx1278_write_register(0x12, 0x40); // Clear RX done flag

        if (strncmp(ack_buffer, "ACK", 3) == 0) {
            printf("✅ ACK Received for Packet ID=%d\n", current_packet_id - 1);
            ack_received = 1;   // ✅ Set ACK flag properly
            sent_packet_count = 0; // ✅ Reset packet count after ACK
        } else {
            printf("❌ Unexpected Data Received: %s\n", ack_buffer);
        }
    }
}


void lora_send(uint16_t packet_id, char *data) {
    char packet[PACKET_SIZE + 2];
    packet[0] = (packet_id >> 8) & 0xFF;
    packet[1] = packet_id & 0xFF;
    strncpy(packet + 2, data, PACKET_SIZE);

    memcpy(last_sent_messages[sent_packet_count], packet, PACKET_SIZE + 2);

    sx1278_write_register(0x0D, 0x00);
    for (int i = 0; i < PACKET_SIZE + 2; i++) {
        sx1278_write_register(0x00, packet[i]);
    }
    sx1278_write_register(0x22, PACKET_SIZE + 2);
    sx1278_write_register(0x01, 0x83);

    printf("📡 Packet Sent: ID=%d\n", packet_id);
    sent_packet_count++;

    // ✅ Wait for ACK after sending PACKETS_BEFORE_WAIT packets
    if (sent_packet_count >= PACKETS_BEFORE_WAIT) {
        while ((sx1278_read_register(0x12) & 0x08) == 0); // Wait for TX Done
        sx1278_write_register(0x12, 0x08); // Clear TX Done flag

        printf("📥 TX Complete. Switching to RX mode for ACK...\n");
        sx1278_write_register(0x01, 0x85);  // Switch to RX mode

        int wait_time = 0;
        ack_received = 0;  // ✅ Ensure ACK is reset

        while (!ack_received && wait_time < ACK_TIMEOUT_MS) {
            sleep_ms(100);
            wait_time += 100;
        }

        if (!ack_received) {
            printf("❌ ACK not received! Retrying last %d packets...\n", PACKETS_BEFORE_WAIT);
            retry_last_packets();  // Retransmit stored packets
        }

        sent_packet_count = 0; // ✅ Reset packet count after ACK check
    }
}

void retry_last_packets() {
    for (int i = 0; i < PACKETS_BEFORE_WAIT; i++) {
        printf("Resending Packet ID=%d\n", current_packet_id - PACKETS_BEFORE_WAIT + i);

        sx1278_write_register(0x0D, 0x00); // Reset FIFO pointer
        for (int j = 0; j < PACKET_SIZE + 2; j++) {
            sx1278_write_register(0x00, last_sent_messages[i][j]);
        }
        sx1278_write_register(0x22, PACKET_SIZE + 2);
        sx1278_write_register(0x01, 0x83); // TX Mode

        while ((sx1278_read_register(0x12) & 0x08) == 0); // Wait for TX Done
        sx1278_write_register(0x12, 0x08); // Clear TX Done flag
    }

    // After retransmission, switch back to RX Mode
    printf("Retransmission complete. Switching to RX mode.\n");
    sx1278_write_register(0x01, 0x85);
}

void simulate_skipped_packets() {
    char message[PACKET_SIZE] = "Test Packet";

    for (uint16_t packet_id = 0; packet_id <= 5; packet_id++) {
        if (packet_id == 3 || packet_id == 4) {
            printf("Skipping Packet ID=%d\n", packet_id);
            continue;  // Simulate packet loss
        }

        printf("Sending Packet ID=%d\n", packet_id);
        lora_send(packet_id, message);
        sleep_ms(500);

        // Wait for ACK if needed
        if (sent_packet_count >= PACKETS_BEFORE_WAIT) {
            printf("Waiting for ACK before sending more...\n");
            while (!ack_received) {
                sleep_ms(100);
            }
            ack_received = 0; // Reset flag for next batch
        }
    }
}

void test_send_12_packets_and_last() {
    char message[PACKET_SIZE] = "Simulated Packet";
    
    // ✅ Send 12 Normal Packets
    for (uint16_t packet_id = 0; packet_id < 12; packet_id++) {
        char packet_data[PACKET_SIZE] = {0};
        
        // ✅ First 2 bytes = Packet ID
        packet_data[0] = (packet_id >> 8) & 0xFF;
        packet_data[1] = packet_id & 0xFF;
        
        // ✅ Next 2 bytes = Previous Packet ID (or 0x0000 for first packet)
        if (packet_id > 0) {
            packet_data[2] = ((packet_id - 1) >> 8) & 0xFF;
            packet_data[3] = (packet_id - 1) & 0xFF;
        } else {
            packet_data[2] = 0x00;
            packet_data[3] = 0x00;
        }

        // ✅ Fill remaining data
        strncpy(packet_data + 4, message, PACKET_SIZE - 4);
        
        printf("📤 Sending Packet ID=%d\n", packet_id);
        lora_send(packet_id, packet_data);
        sleep_ms(500);

        // Wait for ACK after `PACKETS_BEFORE_WAIT`
        if (sent_packet_count >= PACKETS_BEFORE_WAIT) {
            printf("⏳ Waiting for ACK before sending more...\n");
            int wait_time = 0;
            ack_received = 0;

            while (!ack_received && wait_time < ACK_TIMEOUT_MS) {
                sleep_ms(100);
                wait_time += 100;
            }

            if (!ack_received) {
                printf("❌ ACK not received! Retrying last %d packets...\n", PACKETS_BEFORE_WAIT);
                retry_last_packets();
            }
        }
    }

    // ✅ Send the Last Packet
    char last_packet[PACKET_SIZE] = {0};

    // ✅ First 2 bytes = LAST_PACKET_TAG
    last_packet[0] = (LAST_PACKET_TAG >> 8) & 0xFF;
    last_packet[1] = LAST_PACKET_TAG & 0xFF;

    // ✅ Next 2 bytes = Previous Packet ID (Packet 11)
    uint16_t prev_packet_id = current_packet_id - 1;  // Correct offset
    last_packet[2] = (prev_packet_id >> 8) & 0xFF;
    last_packet[3] = prev_packet_id & 0xFF;

    // ✅ Fill remaining data
    strncpy(last_packet + 4, "LAST PACKET", PACKET_SIZE - 4);

    printf("🚀 Sending Last Packet (Tag: 0xFFFF)\n");
    lora_send(LAST_PACKET_TAG, last_packet);

    // ✅ Wait for final ACK
    printf("⏳ Waiting for Final ACK...\n");
    int wait_time = 0;
    ack_received = 0;

    while (!ack_received && wait_time < ACK_TIMEOUT_MS) {
        sleep_ms(100);
        wait_time += 100;
    }

    if (!ack_received) {
        printf("❌ Final ACK not received! Retrying last packet...\n");
        retry_last_packets();
    } else {
        printf("✅ Final ACK received. Transmission complete!\n");
    }
}



/*int main() {
    stdio_init_all();
    spi_init_pico();
    lora_init();
    setup_lora_interrupt();  // ✅ Ensure correct interrupt setup

    printf("🚀 LoRa Transmitter with ACK Handling Ready...\n");

    while (1) {
        if (sent_packet_count < PACKETS_BEFORE_WAIT || ack_received) {
            char message[PACKET_SIZE];  
            printf("📝 Enter message: ");
            scanf("%s", message);

            printf("📤 Sending: %s\n", message);
            lora_send(current_packet_id, message);
            current_packet_id++;

            ack_received = 0; // ✅ Reset ACK flag after sending
        } else {
            printf("⏳ Waiting for ACK...\n");

            int wait_time = 0;
            while (!ack_received && wait_time < ACK_TIMEOUT_MS) {
                sleep_ms(100);
                wait_time += 100;
            }

            if (!ack_received) {
                printf("❌ ACK not received! Retrying last %d packets...\n", PACKETS_BEFORE_WAIT);
                retry_last_packets();  // Retransmit stored packets
            }
        }
    }

    return 0;
}*/

//skipping packets test
int main() {
    stdio_init_all();
    spi_init_pico();
    lora_init();
    setup_lora_interrupt();
    sleep_ms(5*1000);

    printf("LoRa transmitter with simulated skipped packets...\n");

    //simulate_skipped_packets();  // Run the skipping test
    test_send_12_packets_and_last();

    while (1) {
        sleep_ms(100);  // Keep running
    }

    return 0;
}