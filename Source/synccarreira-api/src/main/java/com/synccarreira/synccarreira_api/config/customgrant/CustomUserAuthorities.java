package com.synccarreira.synccarreira_api.config.customgrant;

import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;
import java.util.Collections;

public class CustomUserAuthorities {

	private final String username;
	private final Collection<GrantedAuthority> authorities;

	public CustomUserAuthorities(String username, Collection<? extends GrantedAuthority> authorities) {
		this.username = username;
		this.authorities = Collections.unmodifiableCollection(authorities);
	}

	public String getUsername() {
		return username;
	}

	public Collection<GrantedAuthority> getAuthorities() {
		return authorities;
	}
}
