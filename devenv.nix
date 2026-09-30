{
  pkgs,
  ...
}:

{
  packages = with pkgs; [
    bun
    cargo-watch
    diesel-cli
    sqlite
  ];

  dotenv.enable = true;

  languages.rust = {
    enable = true;
    lsp.enable = true;
    components = [
      "rustfmt"
      "clippy"
      "rust-analyzer"
      "cargo"
      "rustc"
    ];
  };

  git-hooks.hooks = {
    shellcheck.enable = true;
    prettier.enable = true;
    nixfmt.enable = true;
  };
}
