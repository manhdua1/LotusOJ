package io.github.manhdua1.lotusoj.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String SUBMISSION_QUEUE = "submission.queue";
    public static final String SUBMISSION_EXCHANGE = "submission.exchange";
    public static final String SUBMISSION_ROUTING_KEY = "submission.judge";

    public static final String DLX_EXCHANGE = "submission.dlx";
    public static final String DLQ_QUEUE = "submission.dlq";
    public static final String DLQ_ROUTING_KEY = "submission.dead";

    @Bean
    public DirectExchange submissionExchange() {
        return new DirectExchange(SUBMISSION_EXCHANGE);
    }

    @Bean
    public Queue submissionQueue() {
        return QueueBuilder.durable(SUBMISSION_QUEUE)
                .withArgument("x-dead-letter-exchange", DLX_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", DLQ_ROUTING_KEY)
                .build();
    }

    @Bean
    public Binding submissionBinding() {
        return BindingBuilder.bind(submissionQueue())
                .to(submissionExchange())
                .with(SUBMISSION_ROUTING_KEY);
    }

    @Bean
    public DirectExchange dlxExchange() {
        return new DirectExchange(DLX_EXCHANGE);
    }

    @Bean
    public Queue dlqQueue() {
        return QueueBuilder.durable(DLQ_QUEUE).build();
    }

    @Bean
    public Binding dlqBinding() {
        return BindingBuilder.bind(dlqQueue())
                .to(dlxExchange())
                .with(DLQ_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jsonMessageConverter) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter);
        return rabbitTemplate;
    }
}

