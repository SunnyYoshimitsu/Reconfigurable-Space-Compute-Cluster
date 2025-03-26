import pika
import os
import logging
import threading
from dotenv import load_dotenv, dotenv_values

load_dotenv()

#logging.basicConfig(level=logging.DEBUG)

class RabbitMQ:
    def __init__(self):
        print(os.getenv('RABBITMQ_HOST'))
        
        self.user = os.getenv('RABBITMQ_USER', 'user')
        self.password = os.getenv('RABBITMQ_PASS', 'password')
        self.host = os.getenv('RABBITMQ_HOST', 'localhost')
        self.port = int(os.getenv('RABBITMQ_PORT', 5672))
        self.connection = None
        self.channel = None
        self.connect()
        self.stop_event = threading.Event()
        
    def connect(self):
        credentials = pika.PlainCredentials(self.user, self.password)
        parameters = pika.ConnectionParameters(host=self.host, port=self.port, virtual_host='/', credentials=credentials, heartbeat=60)
        
        try:
            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()
                                    
            if not self.channel:
                raise Exception("Connection is not established.")
            else:
                print("Connected to RabbitMQ")
        except Exception as e:
            print(f"Connection error: {e}")

            
    def close(self):
        if self.connection and not self.connection.is_closed:
            self.connection.close()

    def consume(self, queue_name, callback):
        try:
            if not self.channel:
                raise Exception("Connection is not established.")
        
            self.channel.queue_declare(queue=queue_name, durable=True)
            self.channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)
            
            while not self.stop_event.is_set():
                self.connection.process_data_events(time_limit=1)
        except Exception as e:
            print(f"Consumer stopped with error: {e}")
        finally:
            self.close()

    def publish(self, queue_name, message):
        if not self.channel:
            raise Exception("Connection is not established.")
        
        self.channel.queue_declare(queue=queue_name, durable=True)
        self.channel.basic_publish(exchange='',
                                   routing_key=queue_name,
                                   body=message,
                                   properties=pika.BasicProperties(
                                       delivery_mode=2,
                                   ))
                
    def stop(self):
        self.stop_event.set()