#include <stdio.h>
#include <string.h>
#include "pico/stdlib.h"
#include "hardware/spi.h"
#include "hardware/gpio.h"
#include "hardware/sync.h"
#include "pico/mutex.h"
#include "pico/multicore.h"
#include "tusb.h"  // TinyUSB for USB CDC

// LoRa SPI Configuration
#define SPI_PORT spi1
#define PIN_SCK 10
#define PIN_MISO 12
#define PIN_MOSI 11
#define PIN_NSS 13
#define PIN_RST 15
#define PIN_DIO0 14

#define PACKET_SIZE 128
#define CHUNK_SIZE 5
#define FIFO_SIZE 32

volatile bool last_packet_received = false;
#define LAST_PACKET_TAG 0xFFFF
volatile uint16_t expected_packet_id = 0;

// FIFO Queue Structure
typedef struct {
    uint8_t buffer[FIFO_SIZE][PACKET_SIZE];
    volatile int head, tail, count;
    mutex_t fifo_mutex;
} fifo_queue_t;

fifo_queue_t packet_fifo;

// Function Prototypes
void fifo_init(fifo_queue_t *q);
void spi_init_pico();
void sx1278_reset();
void sx1278_write_register(uint8_t reg, uint8_t value);
uint8_t sx1278_read_register(uint8_t reg);
void lora_init();
void setup_lora_interrupt();
void lora_send_ack();
void on_lora_rx_done(uint gpio, uint32_t events);
void core1_process_fifo();
void send_usb_telemetry();
void send_periodic_telemetry();

// Initialize LoRa FIFO queue
void fifo_init(fifo_queue_t *q) {
    q->head = q->tail = q->count = 0;
    mutex_init(&q->fifo_mutex);
}

// SPI Setup for LoRa
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

// LoRa Chip Reset
void sx1278_reset() {
    gpio_put(PIN_RST, 0);
    sleep_ms(10);
    gpio_put(PIN_RST, 1);
    sleep_ms(10);
}

// Write to LoRa Register
void sx1278_write_register(uint8_t reg, uint8_t value) {
    uint8_t data[2] = {reg | 0x80, value};
    gpio_put(PIN_NSS, 0);
    spi_write_blocking(SPI_PORT, data, 2);
    gpio_put(PIN_NSS, 1);
}

// Read from LoRa Register
uint8_t sx1278_read_register(uint8_t reg) {
    uint8_t value;
    gpio_put(PIN_NSS, 0);
    spi_write_blocking(SPI_PORT, &reg, 1);
    spi_read_blocking(SPI_PORT, 0, &value, 1);
    gpio_put(PIN_NSS, 1);
    return value;
}

// LoRa Module Initialization
void lora_init() {
    sx1278_reset();
    sx1278_write_register(0x01, 0x80);
    sx1278_write_register(0x09, 0xFF);
    sx1278_write_register(0x0E, 0x00);
    sx1278_write_register(0x0F, 0x00);
    sx1278_write_register(0x1D, 0x72);
    sx1278_write_register(0x1E, 0x74);
    sx1278_write_register(0x01, 0x85); // RX continuous mode
}

// LoRa Interrupt Setup
void setup_lora_interrupt() {
    gpio_init(PIN_DIO0);
    gpio_set_dir(PIN_DIO0, GPIO_IN);
    gpio_pull_down(PIN_DIO0);
    gpio_set_irq_enabled_with_callback(PIN_DIO0, GPIO_IRQ_EDGE_RISE, true, &on_lora_rx_done);
}

// LoRa Packet Received Handler
void on_lora_rx_done(uint gpio, uint32_t events) {
    if (gpio == PIN_DIO0) {
        uint8_t len = sx1278_read_register(0x13);
        sx1278_write_register(0x0D, sx1278_read_register(0x10));

        if (last_packet_received) {
            lora_send_ack();
        }
    }
}

// LoRa Acknowledgment
void lora_send_ack() {
    sx1278_write_register(0x01, 0x81);
    sx1278_write_register(0x0D, 0x00);
    sx1278_write_register(0x00, 'A');
    sx1278_write_register(0x00, 'C');
    sx1278_write_register(0x00, 'K');
    sx1278_write_register(0x22, 3);
    sx1278_write_register(0x01, 0x83);

    while (!(sx1278_read_register(0x12) & 0x08));
    sx1278_write_register(0x12, 0x08);
    sx1278_write_register(0x01, 0x85);
}

// Core 1 Processing FIFO Queue
void core1_process_fifo() {
    while (1) {
        if (packet_fifo.count > 0) {
            mutex_enter_blocking(&packet_fifo.fifo_mutex);
            packet_fifo.tail = (packet_fifo.tail + 1) % FIFO_SIZE;
            packet_fifo.count--;
            mutex_exit(&packet_fifo.fifo_mutex);
            send_usb_telemetry();
        }
    }
}

// Send Data via USB CDC
void send_usb_telemetry() {
    uint32_t x = 100, y = 200, z = 300, temp = 25, voltage = 12, current = 5, battery_level = 80;
    float sun_location[4] = {0.1f, 0.2f, 0.3f, 0.4f};
    uint8_t response_data[128] = {0};

    memcpy(response_data, &x, sizeof(x));
    memcpy(response_data + 4, &y, sizeof(y));
    memcpy(response_data + 8, &z, sizeof(z));
    memcpy(response_data + 12, sun_location, sizeof(sun_location));
    memcpy(response_data + 28, &temp, sizeof(temp));
    memcpy(response_data + 32, &voltage, sizeof(voltage));
    memcpy(response_data + 36, &current, sizeof(current));
    memcpy(response_data + 40, &battery_level, sizeof(battery_level));

    printf("Telemetry Data: ");
    for (int i = 0; i < 128; i++) {
        printf("%02X", response_data[i]);
    }
    printf("\n");
}

// Function to periodically send telemetry data
void send_periodic_telemetry() {
    absolute_time_t next_time = make_timeout_time_ms(10000); // 10 seconds interval
    while (1) {
        sleep_until(next_time);
        send_usb_telemetry();
        next_time = make_timeout_time_ms(10000);
    }
}

int main() {
    stdio_init_all();
    printf("LoRa Receiver with Periodic USB Telemetry\n");

    spi_init_pico();
    lora_init();
    setup_lora_interrupt();
    fifo_init(&packet_fifo);

    // Start core 1 for FIFO processing
    multicore_launch_core1(core1_process_fifo);

    // Send telemetry every 10 seconds
    send_periodic_telemetry();

    return 0;
}
