package com.synccarreira.synccarreira_api.services.validation;

public final class DocumentValidator {

    private static final int[] W1 = {5,4,3,2,9,8,7,6,5,4,3,2};
    private static final int[] W2 = {6,5,4,3,2,9,8,7,6,5,4,3,2};

    private DocumentValidator() {
        throw new UnsupportedOperationException("Esta é uma classe utilitária e não deve ser instanciada.");
    }

    public static String onlyDigits(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }

    public static boolean isCpfValid(String cpf) {
        String d = onlyDigits(cpf);
        if (d.length() != 11 || d.chars().distinct().count() == 1) {
            return false;
        }
        try {
            int sum = 0;
            for (int i = 0; i < 9; i++) {
                sum += (d.charAt(i) - '0') * (10 - i);
            }
            int dig1 = 11 - (sum % 11);
            if (dig1 >= 10) dig1 = 0;
            if (dig1 != d.charAt(9) - '0') return false;

            sum = 0;
            for (int i = 0; i < 10; i++) {
                sum += (d.charAt(i) - '0') * (11 - i);
            }
            int dig2 = 11 - (sum % 11);
            if (dig2 >= 10) dig2 = 0;
            return dig2 == d.charAt(10) - '0';
        } catch (RuntimeException e) {
            return false;
        }
    }

    public static boolean isCnpjValid(String cnpj) {
        if (cnpj == null) return false;
        char[] c = normalizeCnpj(cnpj);
        if (c.length != 14 || allCharsEqual(c)) return false;
        return hasValidCnpjCheckDigits(c);
    }

    // Remove a máscara e passa letras para maiúsculas; devolve um array vazio se o formato for inválido
    private static char[] normalizeCnpj(String cnpj) {
        char[] c = new char[14];
        int n = 0;
        for (int i = 0; i < cnpj.length(); i++) {
            char ch = cnpj.charAt(i);
            if (isCnpjMaskChar(ch)) continue;
            if (n == 14) return new char[0];
            if (ch >= 'a' && ch <= 'z') ch -= 32;
            if (!isAllowedCnpjChar(ch, n)) return new char[0];
            c[n++] = ch;
        }
        return n == 14 ? c : new char[0];
    }

    private static boolean isCnpjMaskChar(char ch) {
        return ch == '.' || ch == '/' || ch == '-';
    }

    // As 12 primeiras posições aceitam letras (CNPJ alfanumérico); os dígitos verificadores, só números
    private static boolean isAllowedCnpjChar(char ch, int position) {
        boolean digit = ch >= '0' && ch <= '9';
        boolean letter = ch >= 'A' && ch <= 'Z';
        return digit || (letter && position < 12);
    }

    private static boolean allCharsEqual(char[] c) {
        for (int i = 1; i < c.length; i++) {
            if (c[i] != c[0]) return false;
        }
        return true;
    }

    private static boolean hasValidCnpjCheckDigits(char[] c) {
        int s1 = 0;
        int s2 = 0;
        for (int i = 0; i < 12; i++) {
            int v = c[i] - '0';
            s1 += v * W1[i];
            s2 += v * W2[i];
        }
        int d1 = dv(s1);
        int d2 = dv(s2 + d1 * W2[12]);
        return c[12] - '0' == d1 && c[13] - '0' == d2;
    }

    private static int dv(int sum) {
        int r = sum % 11;
        return r < 2 ? 0 : 11 - r;
    }
}
