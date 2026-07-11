import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { environment } from '../../../environment/environment';

@Component({
  selector: 'app-perfil-candidato',
  imports: [CommonModule],
  templateUrl: './perfil-candidato.html',
  styleUrl: './perfil-candidato.css',
})
export class PerfilCandidato implements OnInit {
  totalCandidatos: number = 0;
  candidatos: any[] = [];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    // 1. Total de candidatos (usando environment)
    this.http.get(`${environment.apiUrl}/candidato/total`).subscribe({
      next: (resposta: any) => {
        this.totalCandidatos = resposta.total;
        this.cdr.detectChanges();
      },
      error: (erro) => console.error('Erro no total:', erro)
    });

    // 2. Lista de candidatos (usando environment)
    this.http.get(`${environment.apiUrl}/candidato`).subscribe({
      next: (resposta: any) => {
        this.candidatos = resposta;
        this.cdr.detectChanges();
      },
      error: (erro) => console.error('Erro nos candidatos:', erro)
    });
  }
}
