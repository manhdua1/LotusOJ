package io.github.manhdua1.lotusoj.mapper;

import io.github.manhdua1.lotusoj.dto.request.RegisterRequest;
import io.github.manhdua1.lotusoj.dto.response.UserResponse;
import io.github.manhdua1.lotusoj.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserResponse toUserResponse(User user);
}
