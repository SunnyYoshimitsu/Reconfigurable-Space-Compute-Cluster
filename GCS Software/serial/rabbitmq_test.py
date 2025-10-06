from classes.rabbitmq import RabbitMQ
import sys
import time

rabbitmq = RabbitMQ()
print("RabbitMQ Connection Established")

def send_message(message='test'):
    rabbitmq.publish(queue_name="server_queue", message=message)
    print(f"Sent message: {message}")

try:
    while True:
        send_message("hello")
        time.sleep(5)
finally:
    rabbitmq.close()
    print("RabbitMQ Connection Closed...")
