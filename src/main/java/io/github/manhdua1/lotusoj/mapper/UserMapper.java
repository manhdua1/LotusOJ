package io.github.manhdua1.lotusoj.mapper;

import io.github.manhdua1.lotusoj.dto.response.auth.UserResponse;
import io.github.manhdua1.lotusoj.entity.auth.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserResponse toUserResponse(User user);
}
