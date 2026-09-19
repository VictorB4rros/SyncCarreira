package com.synccarreira.synccarreira_api.services.validation;

public final class DocumentValidator {

    public DocumentValidator() {
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
        String d = onlyDigits(cnpj);
        if (d.length() != 14 || d.chars().distinct().count() == 1) {
            return false;
        }
        try {
            int[] weight1 = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
            int[] weight2 = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};

            int sum = 0;
            for (int i = 0; i < 12; i++) {
                sum += (d.charAt(i) - '0') * weight1[i];
            }
            int dig1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
            if (dig1 != d.charAt(12) - '0') return false;

            sum = 0;
            for (int i = 0; i < 13; i++) {
                sum += (d.charAt(i) - '0') * weight2[i];
            }
            int dig2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
            return dig2 == d.charAt(13) - '0';
        } catch (RuntimeException e) {
            return false;
        }
    }
}
