using GoldPC.ServicesService.Entities;
using Microsoft.EntityFrameworkCore;

namespace GoldPC.ServicesService.Data;

public class ServicesDbContext : DbContext
{
    public ServicesDbContext(DbContextOptions<ServicesDbContext> options) : base(options) { }
    
    public DbSet<ServiceRequest> ServiceRequests => Set<ServiceRequest>();
    public DbSet<ServiceType> ServiceTypes => Set<ServiceType>();
    public DbSet<ServicePart> ServiceParts => Set<ServicePart>();
    public DbSet<WorkReport> WorkReports => Set<WorkReport>();
    public DbSet<TicketMessage> TicketMessages => Set<TicketMessage>();
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.Entity<ServiceType>(entity =>
        {
            entity.ToTable("service_types");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(100);
            entity.Property(e => e.Slug).HasColumnName("slug").IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasColumnName("description").HasMaxLength(500);
            entity.Property(e => e.BasePrice).HasColumnName("base_price").HasPrecision(12, 2);
            entity.Property(e => e.EstimatedDurationMinutes).HasColumnName("estimated_duration_minutes");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
        });
        
        modelBuilder.Entity<ServiceRequest>(entity =>
        {
            entity.ToTable("service_requests");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.HasIndex(e => e.RequestNumber).IsUnique();
            entity.Property(e => e.RequestNumber).HasColumnName("request_number").IsRequired().HasMaxLength(20);
            entity.Property(e => e.ClientId).HasColumnName("client_id");
            entity.Property(e => e.MasterId).HasColumnName("master_id");
            entity.Property(e => e.ServiceTypeId).HasColumnName("service_type_id");
            entity.Property(e => e.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.Description).HasColumnName("description").IsRequired().HasMaxLength(2000);
            entity.Property(e => e.DeviceModel).HasColumnName("device_model").HasMaxLength(100);
            entity.Property(e => e.SerialNumber).HasColumnName("serial_number").HasMaxLength(50);
            entity.Property(e => e.EstimatedCost).HasColumnName("estimated_cost").HasPrecision(12, 2);
            entity.Property(e => e.ActualCost).HasColumnName("actual_cost").HasPrecision(12, 2);
            entity.Property(e => e.MasterComment).HasColumnName("master_comment").HasMaxLength(2000);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            entity.Property(e => e.CompletedAt).HasColumnName("completed_at");
            
            entity.HasOne(e => e.ServiceType)
                .WithMany(st => st.ServiceRequests)
                .HasForeignKey(e => e.ServiceTypeId)
                .HasConstraintName("fk_service_requests_service_type");
        });
        
        modelBuilder.Entity<ServicePart>(entity =>
        {
            entity.ToTable("service_parts");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ServiceRequestId).HasColumnName("service_request_id");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.ProductName).HasColumnName("product_name").IsRequired().HasMaxLength(255);
            entity.Property(e => e.Quantity).HasColumnName("quantity");
            entity.Property(e => e.UnitPrice).HasColumnName("unit_price").HasPrecision(12, 2);
            
            entity.HasOne(e => e.ServiceRequest)
                .WithMany(sr => sr.ServiceParts)
                .HasForeignKey(e => e.ServiceRequestId)
                .HasConstraintName("fk_service_parts_service_request")
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.ServiceRequestId);
        });
        
        modelBuilder.Entity<WorkReport>(entity =>
        {
            entity.ToTable("work_reports");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ServiceRequestId).HasColumnName("service_request_id");
            entity.Property(e => e.PreviousStatus).HasColumnName("previous_status").HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.NewStatus).HasColumnName("new_status").HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.Comment).HasColumnName("comment").HasMaxLength(1000);
            entity.Property(e => e.ChangedBy).HasColumnName("changed_by");
            entity.Property(e => e.ChangedAt).HasColumnName("changed_at");
            
            entity.HasOne(e => e.ServiceRequest)
                .WithMany(sr => sr.WorkReports)
                .HasForeignKey(e => e.ServiceRequestId)
                .HasConstraintName("fk_work_reports_service_request")
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.ServiceRequestId);
        });
        
        modelBuilder.Entity<TicketMessage>(entity =>
        {
            entity.ToTable("ticket_messages");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ServiceRequestId).HasColumnName("service_request_id");
            entity.Property(e => e.AuthorId).HasColumnName("author_id");
            entity.Property(e => e.AuthorRole).HasColumnName("author_role").IsRequired().HasMaxLength(20);
            entity.Property(e => e.Content).HasColumnName("content").IsRequired().HasMaxLength(2000);
            entity.Property(e => e.FileUrl).HasColumnName("file_url").HasMaxLength(1000);
            entity.Property(e => e.FileName).HasColumnName("file_name").HasMaxLength(255);
            entity.Property(e => e.FileSize).HasColumnName("file_size");
            entity.Property(e => e.ContentType).HasColumnName("content_type").HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.ReadAt).HasColumnName("read_at");

            entity.HasOne(e => e.ServiceRequest)
                .WithMany(sr => sr.TicketMessages)
                .HasForeignKey(e => e.ServiceRequestId)
                .HasConstraintName("fk_ticket_messages_service_request")
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.ServiceRequestId);
        });
    }
}