package com.synccarreira.synccarreira_api.services.validation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Testes para a classe DocumentValidator")
public class DocumentValidatorTests {

    private String validCpf, validCpfWithMask, repeatedCpf, invalidCpf, emptyCpf;
    private String validCnpj, validCnpjWithMask, validCnpjOnlyNumbers, validCnpjOnlyNumbersWithMask, repeatedCnpj, invalidCnpj, emptyCnpj, nullCnpj;

    @BeforeEach
    void setUp() {
        validCpf = "49472970001";
        validCpfWithMask = "494.729.700-01";
        repeatedCpf = "11111111111";
        invalidCpf = "12345678901";
        emptyCpf = "    ";
        validCnpj = "39ZZMVB3000177";
        validCnpjWithMask = "YP.4XW.BLM/0001-68";
        validCnpjOnlyNumbers = "09881666000170";
        validCnpjOnlyNumbersWithMask = "09.881.666/0001-70";
        repeatedCnpj = "11111111111111";
        invalidCnpj = "11222333000182";
        emptyCnpj = "   ";
        nullCnpj = null;
    }

    @Test
    void privateConstructorShouldReturnUnsupportedOperationException() throws NoSuchMethodException {
        Constructor<DocumentValidator> constructor = DocumentValidator.class.getDeclaredConstructor();
        constructor.setAccessible(true);

        assertThatThrownBy(constructor::newInstance)
                .isInstanceOf(InvocationTargetException.class)
                .hasCauseInstanceOf(UnsupportedOperationException.class)
                .hasRootCauseMessage("Esta é uma classe utilitária e não deve ser instanciada.");
    }

    @Nested
    @DisplayName("Testes do método onlyDigits")
    class OnlyDigitsTests {

        @Test
        void onlyDigitsShouldReturnEmptyWhenStringIsNull() {
            assertThat(DocumentValidator.onlyDigits(null)).isEqualTo("");
        }

        @Test
        void onlyDigitsShouldStripNonDigits() {
            assertThat(DocumentValidator.onlyDigits("123.456.789-00")).isEqualTo("12345678900");
            assertThat(DocumentValidator.onlyDigits("12.345.678/0001-95")).isEqualTo("12345678000195");
            assertThat(DocumentValidator.onlyDigits("abc-123_45#6")).isEqualTo("123456");
        }

        @Test
        void onlyDigitsShouldReturnSameDigitsWhenOnlyDigitsProvided() {
            assertThat(DocumentValidator.onlyDigits("12345678900")).isEqualTo("12345678900");
        }
    }

    @Nested
    @DisplayName("Testes do método isCpfValid")
    class isCpfValidTests {

        @Test
        void isCpfValidShouldReturnTrueForValidCpf() {
            assertThat(DocumentValidator.isCpfValid(validCpf)).isTrue();
            assertThat(DocumentValidator.isCpfValid(validCpfWithMask)).isTrue();
        }

        @Test
        void isCpfValidShouldReturnFalseForRepeatedDigits() {
            assertThat(DocumentValidator.isCpfValid(repeatedCpf)).isFalse();
        }

        @Test
        void isCpfValid_ShouldReturnFalse_ForInvalidCpf() {
            assertThat(DocumentValidator.isCpfValid(invalidCpf)).isFalse();
        }

        @Test
        void isCpfValidShouldReturnFalseForNullOrEmpty() {
            assertThat(DocumentValidator.isCpfValid(emptyCpf)).isFalse();
        }
    }

    @Nested
    @DisplayName("Testes do método isCnpjValid")
    class isCnpjValidTests {

        @Test
        void isCnpjValidShouldReturnTrueForValidCnpj() {
            assertThat(DocumentValidator.isCnpjValid(validCnpj)).isTrue();
            assertThat(DocumentValidator.isCnpjValid(validCnpjOnlyNumbers)).isTrue();
            assertThat(DocumentValidator.isCnpjValid(validCnpjWithMask)).isTrue();
            assertThat(DocumentValidator.isCnpjValid(validCnpjOnlyNumbersWithMask)).isTrue();
        }

        @Test
        void isCnpjValidShouldReturnFalseForRepeatedDigits() {
            assertThat(DocumentValidator.isCnpjValid(repeatedCnpj)).isFalse();
        }

        @Test
        void isCnpjValidShouldReturnFalseForInvalidCnpj() {
            assertThat(DocumentValidator.isCnpjValid(invalidCnpj)).isFalse();
        }

        @Test
        void isCnpjValidShouldReturnFalseForNullOrEmpty() {
            assertThat(DocumentValidator.isCnpjValid(emptyCnpj)).isFalse();
            assertThat(DocumentValidator.isCnpjValid(nullCnpj)).isFalse();
        }
    }
}
