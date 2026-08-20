package io.github.manhdua1.lotusoj.config;

import io.github.manhdua1.lotusoj.entity.auth.User;
import io.github.manhdua1.lotusoj.entity.problem.Problem;
import io.github.manhdua1.lotusoj.entity.problem.Tag;
import io.github.manhdua1.lotusoj.entity.testCase.TestCase;
import io.github.manhdua1.lotusoj.repository.auth.UserRepository;
import io.github.manhdua1.lotusoj.repository.problem.ProblemRepository;
import io.github.manhdua1.lotusoj.repository.problem.TagRepository;
import io.github.manhdua1.lotusoj.repository.testCase.TestCaseRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DataInitializer implements CommandLineRunner {

    UserRepository userRepository;
    TagRepository tagRepository;
    ProblemRepository problemRepository;
    TestCaseRepository testCaseRepository;
    PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0 && problemRepository.count() > 0) {
            log.info("Sample data already exists. Skipping data initialization.");
            return;
        }

        log.info("Starting sample data initialization...");

        // 1. Initialize Users
        Map<String, User> users = initUsers();

        // 2. Initialize Tags
        Map<String, Tag> tags = initTags();

        // 3. Initialize Problems & TestCases
        initProblems(users, tags);

        log.info("Sample data initialization completed successfully!");
    }

    private Map<String, User> initUsers() {
        Map<String, User> userMap = new HashMap<>();

        createUserIfNotExists(userMap, "admin@lotusoj.com", "admin", "Admin User",
                "Password123@", User.Role.ADMIN, "https://api.dicebear.com/7.x/bottts/svg?seed=admin");

        createUserIfNotExists(userMap, "setter@lotusoj.com", "problem_setter", "Problem Setter",
                "Password123@", User.Role.PROBLEM_SETTER, "https://api.dicebear.com/7.x/bottts/svg?seed=setter");

        createUserIfNotExists(userMap, "manager@lotusoj.com", "contest_manager", "Contest Manager",
                "Password123@", User.Role.CONTEST_MANAGER, "https://api.dicebear.com/7.x/bottts/svg?seed=manager");

        createUserIfNotExists(userMap, "alice@lotusoj.com", "alice", "Alice Nguyen",
                "Password123@", User.Role.USER, "https://api.dicebear.com/7.x/bottts/svg?seed=alice");

        createUserIfNotExists(userMap, "bob@lotusoj.com", "bob", "Bob Tran",
                "Password123@", User.Role.USER, "https://api.dicebear.com/7.x/bottts/svg?seed=bob");

        return userMap;
    }

    private void createUserIfNotExists(Map<String, User> map, String email, String username, String displayName,
                                      String rawPassword, User.Role role, String avatarUrl) {
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .email(email)
                    .username(username)
                    .passwordHash(passwordEncoder.encode(rawPassword))
                    .avatarUrl(avatarUrl)
                    .role(role)
                    .status(User.Status.ACTIVE)
                    .totalSolved(0)
                    .totalSubmissions(0)
                    .build();
            return userRepository.save(newUser);
        });
        map.put(username, user);
    }

    private Map<String, Tag> initTags() {
        String[] tagNames = {
                "Array", "String", "Hash Table", "Dynamic Programming",
                "Two Pointers", "Greedy", "Math", "Sorting", "Graph",
                "Tree", "Binary Search", "Breadth-First Search", "Depth-First Search"
        };

        Map<String, Tag> tagMap = new HashMap<>();
        for (String name : tagNames) {
            Tag tag = tagRepository.findByNameIgnoreCase(name).orElseGet(() ->
                    tagRepository.save(Tag.builder().name(name).build())
            );
            tagMap.put(name, tag);
        }
        return tagMap;
    }

    private void initProblems(Map<String, User> users, Map<String, Tag> tags) {
        if (problemRepository.count() > 0) {
            return;
        }

        User setter = users.get("problem_setter");
        User admin = users.get("admin");

        // ----------------------------------------------------
        // Problem 1: Two Sum
        // ----------------------------------------------------
        Problem p1 = Problem.builder()
                .slug("two-sum")
                .title("Two Sum (Hai Số Tổng)")
                .statement("""
                        Cho một mảng số nguyên `nums` gồm $N$ phần tử và một số nguyên `target`.
                        
                        Hãy tìm chỉ số của **hai số** trong mảng sao cho tổng của chúng bằng `target`.
                        
                        Bạn có thể giả định rằng mỗi đầu vào luôn có đúng **một nghiệm duy nhất**, và bạn không được phép sử dụng cùng một phần tử hai lần.
                        
                        Bạn có thể trả về câu trả lời theo bất kỳ thứ tự nào.
                        """)
                .inputFormat("""
                        - Dòng 1: Gồm 2 số nguyên $N$ và $target$ ($2 \\le N \\le 10^4$).
                        - Dòng 2: Gồm $N$ số nguyên cách nhau bởi dấu cách.
                        """)
                .outputFormat("In ra chỉ số (0-indexed) của hai phần tử có tổng bằng target trên cùng một dòng, cách nhau bởi dấu cách.")
                .constraints("""
                        - $2 \\le N \\le 10^4$
                        - $-10^9 \\le nums[i] \\le 10^9$
                        - $-10^9 \\le target \\le 10^9$
                        """)
                .explanationNote("Trong ví dụ 1: nums[0] + nums[1] = 2 + 7 = 9. Do đó chỉ số là 0 1.")
                .timeLimitMs(1000)
                .memoryLimitKb(262144) // 256MB
                .difficulty(Problem.ProblemDifficulty.EASY)
                .status(Problem.ProblemStatus.PUBLISHED)
                .tags(Set.of(tags.get("Array"), tags.get("Hash Table")))
                .totalSubmissions(120)
                .totalAccepted(90)
                .createdBy(setter)
                .createdAt(LocalDateTime.now().minusDays(10))
                .updatedAt(LocalDateTime.now().minusDays(10))
                .isDeleted(false)
                .build();

        problemRepository.save(p1);

        testCaseRepository.saveAll(List.of(
                TestCase.builder().problem(p1).input("4 9\n2 7 11 15").expectedOutput("0 1").isSample(true).orderIndex(1).build(),
                TestCase.builder().problem(p1).input("3 6\n3 2 4").expectedOutput("1 2").isSample(true).orderIndex(2).build(),
                TestCase.builder().problem(p1).input("2 6\n3 3").expectedOutput("0 1").isSample(false).orderIndex(3).build(),
                TestCase.builder().problem(p1).input("5 10\n1 3 5 7 9").expectedOutput("1 3").isSample(false).orderIndex(4).build()
        ));

        // ----------------------------------------------------
        // Problem 2: Longest Palindromic Substring
        // ----------------------------------------------------
        Problem p2 = Problem.builder()
                .slug("longest-palindromic-substring")
                .title("Longest Palindromic Substring (Chuỗi Đối Xứng Dài Nhất)")
                .statement("""
                        Cho một chuỗi ký tự $s$. Hãy tìm và in ra chuỗi con đối xứng (palindromic substring) dài nhất trong $s$.
                        
                        Một chuỗi được gọi là đối xứng nếu đọc từ trái sang phải cũng giống như đọc từ phải sang trái.
                        """)
                .inputFormat("Một dòng duy nhất chứa chuỗi $s$.")
                .outputFormat("In ra chuỗi con đối xứng dài nhất tìm được.")
                .constraints("""
                        - $1 \\le |s| \\le 1000$
                        - $s$ chỉ chứa các chữ cái tiếng Anh in thường và in hoa.
                        """)
                .explanationNote("'aba' cũng là một câu trả lời hợp lệ cho ví dụ 1.")
                .timeLimitMs(1000)
                .memoryLimitKb(262144)
                .difficulty(Problem.ProblemDifficulty.MEDIUM)
                .status(Problem.ProblemStatus.PUBLISHED)
                .tags(Set.of(tags.get("String"), tags.get("Dynamic Programming")))
                .totalSubmissions(85)
                .totalAccepted(42)
                .createdBy(setter)
                .createdAt(LocalDateTime.now().minusDays(7))
                .updatedAt(LocalDateTime.now().minusDays(7))
                .isDeleted(false)
                .build();

        problemRepository.save(p2);

        testCaseRepository.saveAll(List.of(
                TestCase.builder().problem(p2).input("babad").expectedOutput("bab").isSample(true).orderIndex(1).build(),
                TestCase.builder().problem(p2).input("cbbd").expectedOutput("bb").isSample(true).orderIndex(2).build(),
                TestCase.builder().problem(p2).input("a").expectedOutput("a").isSample(false).orderIndex(3).build(),
                TestCase.builder().problem(p2).input("racecar").expectedOutput("racecar").isSample(false).orderIndex(4).build()
        ));

        // ----------------------------------------------------
        // Problem 3: Trapping Rain Water
        // ----------------------------------------------------
        Problem p3 = Problem.builder()
                .slug("trapping-rain-water")
                .title("Trapping Rain Water (Hứng Nước Mưa)")
                .statement("""
                        Cho $N$ số nguyên không âm biểu thị bản đồ độ cao địa hình, trong đó độ rộng của mỗi cột là 1 đơn vị.
                        
                        Hãy tính tổng lượng nước mưa mà địa hình này có thể giữ lại được sau một trận mưa lớn.
                        """)
                .inputFormat("""
                        - Dòng 1: Số nguyên dương $N$.
                        - Dòng 2: $N$ số nguyên không âm cách nhau bởi dấu cách.
                        """)
                .outputFormat("In ra tổng số đơn vị nước mưa giữ lại được.")
                .constraints("""
                        - $1 \\le N \\le 2 \\times 10^4$
                        - $0 \\le height[i] \\le 10^5$
                        """)
                .explanationNote("Tại các vị trí trũng, nước đọng lại có độ sâu tính theo độ cao cột chặn 2 bên.")
                .timeLimitMs(1000)
                .memoryLimitKb(262144)
                .difficulty(Problem.ProblemDifficulty.HARD)
                .status(Problem.ProblemStatus.PUBLISHED)
                .tags(Set.of(tags.get("Array"), tags.get("Two Pointers"), tags.get("Dynamic Programming")))
                .totalSubmissions(60)
                .totalAccepted(20)
                .createdBy(admin)
                .createdAt(LocalDateTime.now().minusDays(5))
                .updatedAt(LocalDateTime.now().minusDays(5))
                .isDeleted(false)
                .build();

        problemRepository.save(p3);

        testCaseRepository.saveAll(List.of(
                TestCase.builder().problem(p3).input("12\n0 1 0 2 1 0 1 3 2 1 2 1").expectedOutput("6").isSample(true).orderIndex(1).build(),
                TestCase.builder().problem(p3).input("6\n4 2 0 3 2 5").expectedOutput("9").isSample(true).orderIndex(2).build(),
                TestCase.builder().problem(p3).input("3\n3 0 3").expectedOutput("3").isSample(false).orderIndex(3).build()
        ));

        // ----------------------------------------------------
        // Problem 4: Binary Search
        // ----------------------------------------------------
        Problem p4 = Problem.builder()
                .slug("binary-search")
                .title("Binary Search (Tìm Kiếm Nhị Phân)")
                .statement("""
                        Cho một mảng các số nguyên `nums` gồm $N$ phần tử đã được sắp xếp theo thứ tự tăng dần, và một số nguyên `target`.
                        
                        Hãy viết hàm tìm kiếm `target` trong mảng `nums`. Nếu `target` tồn tại, trả về chỉ số của nó (0-indexed). Ngược lại, trả về `-1`.
                        
                        **Yêu cầu thuật toán phải chạy với độ phức tạp thời gian $O(\\log N)$.**
                        """)
                .inputFormat("""
                        - Dòng 1: Gồm 2 số nguyên $N$ và $target$.
                        - Dòng 2: Gồm $N$ số nguyên đã sắp xếp tăng dần cách nhau bởi dấu cách.
                        """)
                .outputFormat("In ra chỉ số của target trong mảng hoặc -1 nếu không tìm thấy.")
                .constraints("""
                        - $1 \\le N \\le 10^4$
                        - $-10^4 < nums[i], target < 10^4$
                        - Tất cả các phần tử trong nums là phân biệt.
                        """)
                .explanationNote("9 tồn tại trong nums và chỉ số của nó là 4.")
                .timeLimitMs(500)
                .memoryLimitKb(131072) // 128MB
                .difficulty(Problem.ProblemDifficulty.EASY)
                .status(Problem.ProblemStatus.PUBLISHED)
                .tags(Set.of(tags.get("Array"), tags.get("Binary Search")))
                .totalSubmissions(250)
                .totalAccepted(210)
                .createdBy(setter)
                .createdAt(LocalDateTime.now().minusDays(3))
                .updatedAt(LocalDateTime.now().minusDays(3))
                .isDeleted(false)
                .build();

        problemRepository.save(p4);

        testCaseRepository.saveAll(List.of(
                TestCase.builder().problem(p4).input("6 9\n-1 0 3 5 9 12").expectedOutput("4").isSample(true).orderIndex(1).build(),
                TestCase.builder().problem(p4).input("6 2\n-1 0 3 5 9 12").expectedOutput("-1").isSample(true).orderIndex(2).build(),
                TestCase.builder().problem(p4).input("1 5\n5").expectedOutput("0").isSample(false).orderIndex(3).build()
        ));

        // ----------------------------------------------------
        // Problem 5: Course Schedule (DRAFT)
        // ----------------------------------------------------
        Problem p5 = Problem.builder()
                .slug("course-schedule")
                .title("Course Schedule (Lập Lịch Môn Học)")
                .statement("""
                        Có tổng cộng `numCourses` môn học bạn phải đăng ký, được đánh số từ `0` đến `numCourses - 1`.
                        
                        Bạn được cung cấp một mảng các điều kiện tiên quyết `prerequisites`, trong đó `prerequisites[i] = [a, b]` nghĩa là bạn phải hoàn thành môn học `b` trước khi có thể học môn `a`.
                        
                        Hãy xác định xem có khả thi để bạn hoàn thành tất cả các môn học hay không. Trả về `true` nếu có thể, và `false` nếu không thể.
                        """)
                .inputFormat("""
                        - Dòng 1: Gồm 2 số nguyên `numCourses` và `m` (số lượng cặp điều kiện tiên quyết).
                        - $m$ dòng tiếp theo: Mỗi dòng gồm 2 số nguyên $a$ và $b$.
                        """)
                .outputFormat("In ra 'true' nếu có thể hoàn thành tất cả môn học, ngược lại in ra 'false'.")
                .constraints("""
                        - $1 \\le numCourses \\le 2000$
                        - $0 \\le m \\le 5000$
                        - $0 \\le a, b < numCourses$ và $a \\ne b$
                        """)
                .explanationNote("Có tổng cộng 2 môn. Để học môn 1 bạn phải học môn 0. Do đó có thể hoàn thành.")
                .timeLimitMs(1500)
                .memoryLimitKb(262144)
                .difficulty(Problem.ProblemDifficulty.MEDIUM)
                .status(Problem.ProblemStatus.DRAFT)
                .tags(Set.of(tags.get("Graph"), tags.get("Breadth-First Search"), tags.get("Depth-First Search")))
                .totalSubmissions(0)
                .totalAccepted(0)
                .createdBy(setter)
                .createdAt(LocalDateTime.now().minusDays(1))
                .updatedAt(LocalDateTime.now().minusDays(1))
                .isDeleted(false)
                .build();

        problemRepository.save(p5);

        testCaseRepository.saveAll(List.of(
                TestCase.builder().problem(p5).input("2 1\n1 0").expectedOutput("true").isSample(true).orderIndex(1).build(),
                TestCase.builder().problem(p5).input("2 2\n1 0\n0 1").expectedOutput("false").isSample(true).orderIndex(2).build()
        ));
    }
}
