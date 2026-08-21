package io.github.manhdua1.lotusoj.judge;

import com.rabbitmq.client.Channel;
import io.github.manhdua1.lotusoj.config.RabbitMQConfig;
import io.github.manhdua1.lotusoj.dto.request.submission.SubmissionJudgeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JudgeConsumer {

    private final JudgeService judgeService;

    @RabbitListener(queues = RabbitMQConfig.SUBMISSION_QUEUE)
    public void handleSubmission(SubmissionJudgeMessage message, Channel channel,
                                 @Header(AmqpHeaders.DELIVERY_TAG) long tag) throws IOException {
        try {
            judgeService.judgeSubmission(message.submissionId());
            channel.basicAck(tag, false); // chỉ ack SAU KHI ghi kết quả xong hoàn toàn
        } catch (Exception e) {
            log.error("Judge failed for submission {}", message.submissionId(), e);
            channel.basicNack(tag, false, false); // đẩy sang Dead Letter Queue, không requeue lại
        }
    }
}

