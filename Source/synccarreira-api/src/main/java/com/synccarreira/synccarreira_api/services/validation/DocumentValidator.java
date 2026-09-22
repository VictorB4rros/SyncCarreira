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
        char[] c = new char[14];
        int n = 0;
        for (int i = 0; i < cnpj.length(); i++) {
            char ch = cnpj.charAt(i);
            if (ch == '.' || ch == '/' || ch == '-') continue;
            if (n == 14) return false;
            if (ch >= 'a' && ch <= 'z') ch -= 32;
            boolean digit = ch >= '0' && ch <= '9';
            boolean letter  = ch >= 'A' && ch <= 'Z';
            if (!digit && !(letter && n < 12)) return false;
            c[n++] = ch;
        }
        if (n != 14) return false;

        boolean equals = true;
        for (int i = 1; i < 14 && equals; i++) equals = c[i] == c[0];
        if (equals) return false;

        int s1 = 0, s2 = 0;
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
